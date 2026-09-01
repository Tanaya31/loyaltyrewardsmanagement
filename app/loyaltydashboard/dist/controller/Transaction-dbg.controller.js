sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/Label",
    "sap/m/Select",
    "sap/ui/core/Item",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (
    Controller,
    Dialog,
    Label,
    Select,
    Item,
    Input,
    Button,
    VBox,
    MessageBox,
    MessageToast
) {
    "use strict";

    return Controller.extend(
        "loyaltydashboard.loyaltydashboard.controller.Transaction",
        {

            onInit: function () {
                this._router =
                    this.getOwnerComponent().getRouter();

                this._router
                    .getRoute("RouteTransaction")
                    .attachPatternMatched(
                        function () {
                            this.getView()
                                .getModel()
                                .refresh();
                        },
                        this
                    );
            },


            onRecordPurchase: async function () {

                const oModel =
                    this.getView().getModel();

                const aCustomers =
                    await this._getCustomers(oModel);

                const oCustomerSelect =
                    new Select({
                        width: "100%",
                        items: aCustomers.map(function (oCustomer) {
                            return new Item({
                                key: oCustomer.customerID,
                                text: oCustomer.name
                            });
                        })
                    });

                const oChannelSelect =
                    new Select({
                        width: "100%",
                        selectedKey: "Store",
                        items: [
                            new Item({
                                key: "Store",
                                text: "Store"
                            }),
                            new Item({
                                key: "Online",
                                text: "Online"
                            })
                        ]
                    });

                const oAmountInput =
                    new Input({
                        type: "Number",
                        width: "100%",
                        placeholder: "Enter purchase amount"
                    });

                const oDialog =
                    new Dialog({
                        title: "Record Purchase",
                        contentWidth: "400px",

                        content: new VBox({
                            class: "sapUiMediumMargin",
                            items: [

                                new Label({
                                    text: "Customer",
                                    required: true
                                }),

                                oCustomerSelect,

                                new Label({
                                    text: "Channel",
                                    required: true
                                }).addStyleClass(
                                    "sapUiSmallMarginTop"
                                ),

                                oChannelSelect,

                                new Label({
                                    text: "Purchase Amount",
                                    required: true
                                }).addStyleClass(
                                    "sapUiSmallMarginTop"
                                ),

                                oAmountInput
                            ]
                        }),

                        beginButton: new Button({
                            text: "Record",
                            type: "Emphasized",

                            press: async function () {

                                const sCustomerID =
                                    oCustomerSelect.getSelectedKey();

                                const sChannel =
                                    oChannelSelect.getSelectedKey();

                                const nAmount =
                                    Number(
                                        oAmountInput.getValue()
                                    );

                                if (!sCustomerID) {
                                    MessageBox.error(
                                        "Please select a customer."
                                    );
                                    return;
                                }

                                if (!nAmount || nAmount <= 0) {
                                    MessageBox.error(
                                        "Purchase amount must be greater than zero."
                                    );
                                    return;
                                }

                                try {

                                    const oAction =
                                        oModel.bindContext(
                                            "/recordPurchase(...)"
                                        );

                                    oAction.setParameter(
                                        "customerID",
                                        sCustomerID
                                    );

                                    oAction.setParameter(
                                        "channel",
                                        sChannel
                                    );

                                    oAction.setParameter(
                                        "amount",
                                        nAmount
                                    );

                                    await oAction.execute();

                                    MessageToast.show(
                                        "Purchase recorded successfully."
                                    );

                                    oDialog.close();

                                    oModel.refresh();

                                } catch (oError) {

                                    MessageBox.error(
                                        oError.message ||
                                        "Unable to record purchase."
                                    );
                                }
                            }
                        }),

                        endButton: new Button({
                            text: "Cancel",
                            press: function () {
                                oDialog.close();
                            }
                        }),

                        afterClose: function () {
                            oDialog.destroy();
                        }
                    });

                this.getView().addDependent(oDialog);
                oDialog.open();
            },


            _getCustomers: function (oModel) {

                return oModel
                    .bindList("/Customers")
                    .requestContexts()
                    .then(function (aContexts) {
                        return aContexts.map(
                            function (oContext) {
                                return oContext.getObject();
                            }
                        );
                    });
            },


            onTransactionPress: function (oEvent) {

                const oContext =
                    oEvent.getSource().getBindingContext();

                if (!oContext) {
                    return;
                }

                const oTransaction =
                    oContext.getObject();

                MessageBox.information(
                    "Customer: " +
                    (oTransaction.customerID?.name || "-") +
                    "\nChannel: " +
                    oTransaction.channel +
                    "\nAmount: ₹" +
                    Number(oTransaction.amount).toFixed(2) +
                    "\nPoints Earned: " +
                    oTransaction.pointsEarned,
                    {
                        title: "Purchase Details"
                    }
                );
            },


            formatDate: function (sDate) {

                if (!sDate) {
                    return "-";
                }

                const oDate = new Date(sDate);

                return isNaN(oDate.getTime())
                    ? "-"
                    : oDate.toLocaleString();
            },


            onNavBack: function () {
                this._router.navTo("RouteMain");
            }

        }
    );
});