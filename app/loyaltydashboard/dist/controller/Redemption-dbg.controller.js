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
        "loyaltydashboard.loyaltydashboard.controller.Redemption",
        {

            onInit: function () {
                this._router =
                    this.getOwnerComponent().getRouter();

                this._router
                    .getRoute("RouteRedemption")
                    .attachPatternMatched(
                        function () {
                            this.getView()
                                .getModel()
                                .refresh();
                        },
                        this
                    );
            },

            onRedeemPoints: async function () {

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
                                text:
                                    oCustomer.name +
                                    " (" +
                                    oCustomer.totalPoints +
                                    " pts)"
                            });
                        })
                    });

                const oPointsInput =
                    new Input({
                        type: "Number",
                        width: "100%",
                        placeholder: "Enter points"
                    });

                const oRemarksInput =
                    new Input({
                        width: "100%",
                        placeholder: "Enter remarks"
                    });

                const oDialog =
                    new Dialog({
                        title: "Redeem Loyalty Points",
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
                                    text: "Points to Redeem",
                                    required: true
                                }).addStyleClass(
                                    "sapUiSmallMarginTop"
                                ),

                                oPointsInput,

                                new Label({
                                    text: "Remarks"
                                }).addStyleClass(
                                    "sapUiSmallMarginTop"
                                ),

                                oRemarksInput
                            ]
                        }),

                        beginButton: new Button({
                            text: "Redeem",
                            type: "Emphasized",

                            press: async function () {

                                const sCustomerID =
                                    oCustomerSelect.getSelectedKey();

                                const nPoints =
                                    Number(
                                        oPointsInput.getValue()
                                    );

                                const sRemarks =
                                    oRemarksInput.getValue().trim();

                                if (!sCustomerID) {
                                    MessageBox.error(
                                        "Please select a customer."
                                    );
                                    return;
                                }

                                if (!nPoints || nPoints <= 0) {
                                    MessageBox.error(
                                        "Points used must be greater than zero."
                                    );
                                    return;
                                }

                                try {

                                    const oAction =
                                        oModel.bindContext(
                                            "/redeemPoints(...)"
                                        );

                                    oAction.setParameter(
                                        "customerID",
                                        sCustomerID
                                    );

                                    oAction.setParameter(
                                        "pointsUsed",
                                        nPoints
                                    );

                                    oAction.setParameter(
                                        "remarks",
                                        sRemarks
                                    );

                                    await oAction.execute();

                                    MessageToast.show(
                                        "Points redeemed successfully."
                                    );

                                    oDialog.close();
                                    oModel.refresh();

                                } catch (oError) {

                                    MessageBox.error(
                                        oError.message ||
                                        "Unable to redeem points."
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

            onRedemptionPress: function (oEvent) {

                const oRedemption =
                    oEvent.getSource()
                        .getBindingContext()
                        .getObject();

                MessageBox.information(
                    "Customer: " +
                    (oRedemption.customerID?.name || "-") +
                    "\nPoints Used: " +
                    oRedemption.pointsUsed +
                    "\nRemarks: " +
                    (oRedemption.remarks || "-") +
                    "\nDate: " +
                    this.formatDate(
                        oRedemption.redeemDate
                    ),
                    {
                        title: "Redemption Details"
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