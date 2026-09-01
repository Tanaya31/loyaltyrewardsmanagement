sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/VBox"
], function (
    Controller,
    MessageToast,
    MessageBox,
    Dialog,
    Button,
    Label,
    Input,
    VBox
) {
    "use strict";

    return Controller.extend(
        "loyaltydashboard.loyaltydashboard.controller.Customer",
        {

            onInit: function () {
                this._oRouter =
                    this.getOwnerComponent().getRouter();
            },

            onCustomerPress: function (oEvent) {

                const oItem =
                    oEvent.getSource();

                const oContext =
                    oItem.getBindingContext();

                if (!oContext) {
                    return;
                }

                const oCustomer =
                    oContext.getObject();

                this._oRouter.navTo(
                    "RouteCustomerDetails",
                    {
                        customerID: oCustomer.customerID
                    }
                );
            },

            onCreateCustomer: function () {

                const oNameInput = new Input({
                    id: this.createId("newCustomerName"),
                    placeholder: "Customer name"
                });

                const oEmailInput = new Input({
                    id: this.createId("newCustomerEmail"),
                    type: "Email",
                    placeholder: "Email address"
                });

                const oDialog = new Dialog({
                    title: "Create Customer",
                    contentWidth: "400px",

                    content: new VBox({
                        class: "sapUiMediumMargin",

                        items: [

                            new Label({
                                text: "Name",
                                required: true
                            }),

                            oNameInput,

                            new Label({
                                text: "Email",
                                required: true,
                                class: "sapUiSmallMarginTop"
                            }),

                            oEmailInput

                        ]
                    }),

                    beginButton: new Button({
                        text: "Create",
                        type: "Emphasized",

                        press: async function () {

                            const sName =
                                oNameInput.getValue().trim();

                            const sEmail =
                                oEmailInput.getValue().trim();

                            if (!sName || !sEmail) {

                                MessageBox.error(
                                    "Name and email are required."
                                );

                                return;
                            }

                            try {

                                const oModel =
                                    this.getView().getModel();

                                const oListBinding =
                                    oModel.bindList(
                                        "/Customers"
                                    );

                                const oContext =
                                    oListBinding.create({
                                        name: sName,
                                        email: sEmail,
                                        totalPoints: 0,
                                        tier: "BRONZE"
                                    });

                                await oContext.created();

                                MessageToast.show(
                                    "Customer created successfully."
                                );

                                oDialog.close();

                                oModel.refresh();

                            } catch (oError) {

                                MessageBox.error(
                                    "Unable to create customer."
                                );

                                console.error(oError);
                            }

                        }.bind(this)
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

            onRefresh: function () {

                const oTable =
                    this.byId("customerTable");

                const oBinding =
                    oTable.getBinding("items");

                if (oBinding) {
                    oBinding.refresh();
                }

                MessageToast.show(
                    "Customer data refreshed."
                );
            },

            onNavBack: function () {

                this._oRouter.navTo(
                    "RouteMain",
                    {},
                    false
                );
            }

        }
    );
});