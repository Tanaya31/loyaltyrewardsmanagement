sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/m/ObjectNumber"
], function (
    Controller,
    MessageToast,
    ColumnListItem,
    Text,
    ObjectNumber
) {
    "use strict";

    return Controller.extend(
        "loyaltydashboard.loyaltydashboard.controller.Main",
        {

            onInit: function () {
                this._loadDashboardData();
            },

            _loadDashboardData: async function () {
                const oModel = this.getOwnerComponent().getModel();

                if (!oModel) {
                    MessageToast.show("OData model is not available.");
                    return;
                }

                try {
                    const [
                        aCustomers,
                        aTransactions,
                        aRedemptions,
                        aPolicies
                    ] = await Promise.all([
                        this._getCollection(oModel, "/Customers"),
                        this._getCollection(oModel, "/Transactions"),
                        this._getCollection(oModel, "/Redemptions"),
                        this._getCollection(oModel, "/RewardPolicies")
                    ]);

                    this.byId("customerCount").setValue(aCustomers.length);
                    this.byId("transactionCount").setValue(aTransactions.length);
                    this.byId("redemptionCount").setValue(aRedemptions.length);
                    this.byId("policyCount").setValue(aPolicies.length);

                    const totalPoints = aCustomers.reduce(
                        (total, customer) =>
                            total + Number(customer.totalPoints || 0),
                        0
                    );

                    this.byId("totalPoints")
                        .setText(totalPoints.toString());

                    const activePolicies = aPolicies.filter(
                        policy => policy.isActive === true
                    ).length;

                    this.byId("activePolicies")
                        .setText(activePolicies.toString());

                    this._loadRecentTransactions(
                        aTransactions,
                        aCustomers
                    );

                } catch (oError) {
                    console.error("Dashboard loading error:", oError);
                    MessageToast.show(
                        "Unable to load dashboard data."
                    );
                }
            },

            _getCollection: async function (oModel, sPath) {
                const oBinding = oModel.bindList(sPath);
                const aContexts =
                    await oBinding.requestContexts(0, 100);

                return aContexts.map(
                    oContext => oContext.getObject()
                );
            },

            _loadRecentTransactions: function (
                aTransactions,
                aCustomers
            ) {
                const oTable =
                    this.byId("recentTransactionsTable");

                oTable.removeAllItems();

                const mCustomers = {};

                aCustomers.forEach(oCustomer => {
                    mCustomers[oCustomer.customerID] =
                        oCustomer.name;
                });

                const aRecent = aTransactions
                    .slice()
                    .sort(
                        (a, b) =>
                            new Date(b.txnDate || 0) -
                            new Date(a.txnDate || 0)
                    )
                    .slice(0, 5);

                aRecent.forEach(oTransaction => {

                    const sCustomerName =
                        mCustomers[
                            oTransaction.customerID_customerID
                        ] || "-";

                    oTable.addItem(
                        new ColumnListItem({
                            cells: [

                                new Text({
                                    text: sCustomerName
                                }),

                                new Text({
                                    text:
                                        oTransaction.channel || "-"
                                }),

                                new ObjectNumber({
                                    number:
                                        Number(
                                            oTransaction.amount || 0
                                        ).toFixed(2),
                                    unit: "₹"
                                }),

                                new ObjectNumber({
                                    number:
                                        oTransaction.pointsEarned || 0
                                }),

                                new Text({
                                    text:
                                        this._formatDate(
                                            oTransaction.txnDate
                                        )
                                })

                            ]
                        })
                    );
                });
            },

            _formatDate: function (sDate) {
                if (!sDate) {
                    return "-";
                }

                const oDate = new Date(sDate);

                return isNaN(oDate.getTime())
                    ? "-"
                    : oDate.toLocaleString();
            },

            onCustomersKpiPress: function () {
                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteCustomer");
            },

            onTransactionsKpiPress: function () {
                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteTransaction");
            },

            onRedemptionsKpiPress: function () {
                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteRedemption");
            },

            onPoliciesKpiPress: function () {
                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteRewardPolicy");
            }

        }
    );
});