sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/Button",
    "sap/m/StandardListItem"
], function (
    Controller,
    MessageBox,
    MessageToast,
    Dialog,
    Input,
    Label,
    VBox,
    Button,
    StandardListItem
) {
    "use strict";

    return Controller.extend(
        "loyaltydashboard.loyaltydashboard.controller.CustomerDetails",
        {

            /* =====================================================
             * INITIALIZATION
             * ===================================================== */

            onInit: function () {

                this._oRouter =
                    this.getOwnerComponent().getRouter();

                this._oRouter
                    .getRoute("RouteCustomerDetails")
                    .attachPatternMatched(
                        this._onCustomerMatched,
                        this
                    );
            },


            /* =====================================================
             * CUSTOMER DETAILS
             * ===================================================== */

            _onCustomerMatched: function (oEvent) {

                const sCustomerID =
                    oEvent.getParameter(
                        "arguments"
                    ).customerID;

                if (!sCustomerID) {
                    return;
                }

                const sPath =
                    "/Customers(" +
                    sCustomerID +
                    ")";

                this.getView().bindElement({
                    path: sPath
                });

                this._loadCustomerHistory(
                    sCustomerID
                );
            },


            /* =====================================================
             * CUSTOMER HISTORY
             * ===================================================== */

            _loadCustomerHistory: async function (
                sCustomerID
            ) {

                const oModel =
                    this.getView().getModel();

                if (!oModel) {
                    return;
                }

                try {

                    const [
                        aTransactions,
                        aRedemptions
                    ] = await Promise.all([

                        this._requestCollection(
                            oModel,
                            "/Transactions"
                        ),

                        this._requestCollection(
                            oModel,
                            "/Redemptions"
                        )

                    ]);

                    const aCustomerTransactions =
                        aTransactions.filter(
                            function (oTransaction) {

                                return (
                                    oTransaction
                                        .customerID_customerID ===
                                    sCustomerID
                                );

                            }
                        );

                    const aCustomerRedemptions =
                        aRedemptions.filter(
                            function (oRedemption) {

                                return (
                                    oRedemption
                                        .customerID_customerID ===
                                    sCustomerID
                                );

                            }
                        );

                    this._displayTransactions(
                        aCustomerTransactions
                    );

                    this._displayRedemptions(
                        aCustomerRedemptions
                    );

                } catch (oError) {

                    console.error(
                        "Unable to load customer history:",
                        oError
                    );

                    MessageBox.error(
                        "Unable to load customer history."
                    );
                }
            },


            /* =====================================================
             * ODATA COLLECTION
             * ===================================================== */

            _requestCollection: function (
                oModel,
                sPath
            ) {

                return new Promise(
                    function (resolve, reject) {

                        const oBinding =
                            oModel.bindList(sPath);

                        oBinding
                            .requestContexts()
                            .then(
                                function (aContexts) {

                                    resolve(
                                        aContexts.map(
                                            function (oContext) {
                                                return oContext
                                                    .getObject();
                                            }
                                        )
                                    );

                                }
                            )
                            .catch(reject);

                    }
                );
            },


            /* =====================================================
             * PURCHASE HISTORY
             * ===================================================== */

            _displayTransactions:
                function (aTransactions) {

                    const oList =
                        this.byId(
                            "purchaseHistoryList"
                        );

                    if (!oList) {
                        return;
                    }

                    oList.removeAllItems();

                    if (!aTransactions.length) {
                        return;
                    }

                    aTransactions.forEach(
                        function (oTransaction) {

                            oList.addItem(
                                new StandardListItem({

                                    title:
                                        oTransaction.channel ||
                                        "-",

                                    description:
                                        "₹ " +
                                        Number(
                                            oTransaction.amount || 0
                                        ).toFixed(2) +
                                        " | Points earned: " +
                                        (
                                            oTransaction
                                                .pointsEarned || 0
                                        ),

                                    info:
                                        this._formatDate(
                                            oTransaction.txnDate
                                        )

                                })
                            );

                        }.bind(this)
                    );
                },


            /* =====================================================
             * REDEMPTION HISTORY
             * ===================================================== */

            _displayRedemptions:
                function (aRedemptions) {

                    const oList =
                        this.byId(
                            "redemptionHistoryList"
                        );

                    if (!oList) {
                        return;
                    }

                    oList.removeAllItems();

                    if (!aRedemptions.length) {
                        return;
                    }

                    aRedemptions.forEach(
                        function (oRedemption) {

                            oList.addItem(
                                new StandardListItem({

                                    title:
                                        "Points used: " +
                                        (
                                            oRedemption
                                                .pointsUsed || 0
                                        ),

                                    description:
                                        oRedemption.remarks ||
                                        "-",

                                    info:
                                        this._formatDate(
                                            oRedemption
                                                .redeemDate
                                        )

                                })
                            );

                        }.bind(this)
                    );
                },


            /* =====================================================
             * DATE FORMATTER
             * ===================================================== */

            _formatDate: function (sDate) {

                if (!sDate) {
                    return "-";
                }

                const oDate =
                    new Date(sDate);

                if (isNaN(oDate.getTime())) {
                    return "-";
                }

                return oDate.toLocaleString();
            },


            /* =====================================================
             * EDIT CUSTOMER
             * ===================================================== */

            onEditCustomer: function () {

                const oContext =
                    this.getView().getBindingContext();

                if (!oContext) {

                    MessageBox.error(
                        "Customer data is not available."
                    );

                    return;
                }

                const oCustomer =
                    oContext.getObject();

                const oNameInput =
                    new Input({
                        value:
                            oCustomer.name || "",
                        placeholder:
                            "Customer name"
                    });

                const oEmailInput =
                    new Input({
                        value:
                            oCustomer.email || "",
                        type:
                            "Email",
                        placeholder:
                            "Email address"
                    });

                const oDialog =
                    new Dialog({

                        title:
                            "Edit Customer",

                        contentWidth:
                            "400px",

                        content:
                            new VBox({

                                class:
                                    "sapUiMediumMargin",

                                items: [

                                    new Label({
                                        text:
                                            "Name",
                                        required:
                                            true
                                    }),

                                    oNameInput,

                                    new Label({
                                        text:
                                            "Email",
                                        required:
                                            true,
                                        class:
                                            "sapUiSmallMarginTop"
                                    }),

                                    oEmailInput

                                ]
                            }),

                        beginButton:
                            new Button({

                                text:
                                    "Save",

                                type:
                                    "Emphasized",

                                press:
                                    async function () {

                                        const sName =
                                            oNameInput
                                                .getValue()
                                                .trim();

                                        const sEmail =
                                            oEmailInput
                                                .getValue()
                                                .trim();

                                        /* Validation */

                                        if (!sName) {

                                            MessageBox.error(
                                                "Customer name is required."
                                            );

                                            return;
                                        }

                                        if (!sEmail) {

                                            MessageBox.error(
                                                "Customer email is required."
                                            );

                                            return;
                                        }

                                        try {

                                            /*
                                             * OData V4 PATCH
                                             */

                                            oContext.setProperty(
                                                "name",
                                                sName
                                            );

                                            oContext.setProperty(
                                                "email",
                                                sEmail
                                            );

                                            /*
                                             * Submit pending changes
                                             */

                                            const oModel =
                                                this
                                                    .getView()
                                                    .getModel();

                                            await oModel
                                                .submitBatch(
                                                    "$auto"
                                                );

                                            MessageToast.show(
                                                "Customer updated successfully."
                                            );

                                            oDialog.close();

                                        } catch (oError) {

                                            console.error(
                                                "Customer update failed:",
                                                oError
                                            );

                                            MessageBox.error(
                                                "Unable to update customer."
                                            );
                                        }

                                    }.bind(this)
                            }),

                        endButton:
                            new Button({

                                text:
                                    "Cancel",

                                press:
                                    function () {

                                        /*
                                         * Reset unsaved
                                         * changes.
                                         */

                                        oContext.resetChanges();

                                        oDialog.close();
                                    }

                            }),

                        afterClose:
                            function () {

                                oDialog.destroy();

                            }
                    });

                this.getView()
                    .addDependent(oDialog);

                oDialog.open();
            },


            /* =====================================================
             * DELETE CUSTOMER
             * ===================================================== */

            onDeleteCustomer: function () {

                const oContext =
                    this.getView().getBindingContext();

                if (!oContext) {

                    MessageBox.error(
                        "Customer data is not available."
                    );

                    return;
                }

                const oCustomer =
                    oContext.getObject();

                MessageBox.confirm(

                    "Delete customer " +
                    oCustomer.name +
                    "?",

                    {

                        title:
                            "Confirm Customer Deletion",

                        actions: [
                            MessageBox.Action.DELETE,
                            MessageBox.Action.CANCEL
                        ],

                        emphasizedAction:
                            MessageBox.Action.DELETE,

                        onClose:
                            async function (sAction) {

                                if (
                                    sAction !==
                                    MessageBox.Action.DELETE
                                ) {
                                    return;
                                }

                                try {

                                    await oContext.delete();

                                    MessageToast.show(
                                        "Customer deleted successfully."
                                    );

                                    this._oRouter.navTo(
                                        "RouteCustomer"
                                    );

                                } catch (oError) {

                                    console.error(
                                        "Customer deletion failed:",
                                        oError
                                    );

                                    MessageBox.error(
                                        "Unable to delete customer. " +
                                        "The customer may have related purchase or redemption records."
                                    );
                                }

                            }.bind(this)
                    }
                );
            },


            /* =====================================================
             * NAVIGATION
             * ===================================================== */

            onNavBack: function () {

                this._oRouter.navTo(
                    "RouteCustomer"
                );
            }

        }
    );
});