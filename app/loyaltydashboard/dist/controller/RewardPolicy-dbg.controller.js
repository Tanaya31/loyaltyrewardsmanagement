sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/CheckBox",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (
    Controller,
    JSONModel,
    Dialog,
    Label,
    Input,
    Button,
    VBox,
    CheckBox,
    MessageBox,
    MessageToast
) {
    "use strict";

    return Controller.extend(
        "loyaltydashboard.loyaltydashboard.controller.RewardPolicy",
        {

            onInit: function () {
                this._router = this.getOwnerComponent().getRouter();

                this.getView().setModel(
                    new JSONModel({ policies: [], current: null }),
                    "policy"
                );

                this._router
                    .getRoute("RouteRewardPolicy")
                    .attachPatternMatched(this._loadPolicies, this);
            },

            /* =========================
             * LOAD POLICIES
             * ========================= */

            _loadPolicies: async function () {
                try {
                    const aContexts = await this.getView()
                        .getModel()
                        .bindList("/RewardPolicies")
                        .requestContexts();

                    const aPolicies = aContexts.map(function (oContext) {
                        return {
                            context: oContext,
                            data: Object.assign({}, oContext.getObject())
                        };
                    });

                    const oCurrent = aPolicies.find(function (p) {
                        return p.data.isActive === true;
                    });

                    this.getView()
                        .getModel("policy")
                        .setData({
                            policies: aPolicies,
                            current: oCurrent
                                ? oCurrent.data
                                : null
                        });

                } catch (oError) {
                    console.error(oError);
                    MessageBox.error(
                        "Unable to load reward policies."
                    );
                }
            },

            /* =========================
             * CREATE
             * ========================= */

            onCreatePolicy: function () {
                this._openPolicyDialog();
            },

            /* =========================
             * EDIT
             * ========================= */

            onEditPolicy: function (oEvent) {
                const oPolicy =
                    oEvent.getSource()
                        .getBindingContext("policy")
                        .getObject();

                this._openPolicyDialog(oPolicy);
            },

            /* =========================
             * POLICY DIALOG
             * ========================= */

            _openPolicyDialog: function (oPolicy) {

                const bEdit = !!oPolicy;

                const oName = new Input({
                    value: bEdit ? oPolicy.data.policyName : ""
                });

                const oBase = new Input({
                    value: bEdit ? oPolicy.data.baseRate : "",
                    type: "Number"
                });

                const oMultiplier = new Input({
                    value: bEdit
                        ? oPolicy.data.onlineMultiplier
                        : "",
                    type: "Number"
                });

                const oSilver = new Input({
                    value: bEdit
                        ? oPolicy.data.silverThreshold
                        : "",
                    type: "Number"
                });

                const oGold = new Input({
                    value: bEdit
                        ? oPolicy.data.goldThreshold
                        : "",
                    type: "Number"
                });

                const oActive = new CheckBox({
                    text: "Set as active policy",
                    selected: bEdit && oPolicy.data.isActive === true
                });

                const oDialog = new Dialog({
                    title: bEdit
                        ? "Edit Reward Policy"
                        : "Create Reward Policy",

                    contentWidth: "400px",

                    content: new VBox({
                        class: "sapUiMediumMargin",
                        items: [

                            new Label({
                                text: "Policy Name",
                                required: true
                            }),
                            oName,

                            new Label({
                                text: "Base Rate",
                                required: true
                            }).addStyleClass("sapUiSmallMarginTop"),
                            oBase,

                            new Label({
                                text: "Online Multiplier",
                                required: true
                            }).addStyleClass("sapUiSmallMarginTop"),
                            oMultiplier,

                            new Label({
                                text: "Silver Threshold",
                                required: true
                            }).addStyleClass("sapUiSmallMarginTop"),
                            oSilver,

                            new Label({
                                text: "Gold Threshold",
                                required: true
                            }).addStyleClass("sapUiSmallMarginTop"),
                            oGold,

                            oActive.addStyleClass("sapUiSmallMarginTop")
                        ]
                    }),

                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",

                        press: async function () {

                            const sName =
                                oName.getValue().trim();

                            const nBase =
                                Number(oBase.getValue());

                            const nMultiplier =
                                Number(oMultiplier.getValue());

                            const nSilver =
                                Number(oSilver.getValue());

                            const nGold =
                                Number(oGold.getValue());

                            const bActive =
                                oActive.getSelected();

                            if (
                                !sName ||
                                nBase <= 0 ||
                                nMultiplier <= 0 ||
                                nSilver < 0 ||
                                nGold <= nSilver
                            ) {
                                MessageBox.error(
                                    "Please enter valid policy values."
                                );
                                return;
                            }

                            try {

                                if (bActive) {
                                    await this._deactivateOthers(
                                        bEdit ? oPolicy : null
                                    );
                                }

                                const oModel =
                                    this.getView().getModel();

                                if (bEdit) {

                                    const oContext =
                                        oPolicy.context;

                                    oContext.setProperty(
                                        "policyName",
                                        sName
                                    );

                                    oContext.setProperty(
                                        "baseRate",
                                        nBase
                                    );

                                    oContext.setProperty(
                                        "onlineMultiplier",
                                        nMultiplier
                                    );

                                    oContext.setProperty(
                                        "silverThreshold",
                                        nSilver
                                    );

                                    oContext.setProperty(
                                        "goldThreshold",
                                        nGold
                                    );

                                    oContext.setProperty(
                                        "isActive",
                                        bActive
                                    );

                                    await oModel.submitBatch("$auto");

                                    MessageToast.show(
                                        "Reward policy updated successfully."
                                    );

                                } else {

                                    const oList =
                                        oModel.bindList(
                                            "/RewardPolicies"
                                        );

                                    const oNew =
                                        oList.create({
                                            policyName: sName,
                                            baseRate: nBase,
                                            onlineMultiplier: nMultiplier,
                                            silverThreshold: nSilver,
                                            goldThreshold: nGold,
                                            isActive: bActive
                                        });

                                    await oNew.created();

                                    MessageToast.show(
                                        "Reward policy created successfully."
                                    );
                                }

                                oDialog.close();
                                await this._loadPolicies();

                            } catch (oError) {

                                console.error(
                                    "Policy save failed:",
                                    oError
                                );

                                MessageBox.error(
                                    oError.message ||
                                    "Unable to save reward policy."
                                );
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

            /* =========================
             * DEACTIVATE OTHER POLICIES
             * ========================= */

            _deactivateOthers: async function (oKeep) {

                const aContexts =
                    await this.getView()
                        .getModel()
                        .bindList("/RewardPolicies")
                        .requestContexts();

                aContexts.forEach(function (oContext) {

                    if (
                        oContext.getObject().isActive === true &&
                        (!oKeep || oContext !== oKeep.context)
                    ) {
                        oContext.setProperty(
                            "isActive",
                            false
                        );
                    }
                });

                await this.getView()
                    .getModel()
                    .submitBatch("$auto");
            },

            /* =========================
             * ACTIVATE
             * ========================= */

            onActivatePolicy: function (oEvent) {

                const oPolicy =
                    oEvent.getSource()
                        .getBindingContext("policy")
                        .getObject();

                MessageBox.confirm(
                    "Activate '" +
                    oPolicy.data.policyName +
                    "' as the current reward policy?",
                    {
                        title: "Activate Policy",

                        onClose: async function (sAction) {

                            if (
                                sAction !==
                                MessageBox.Action.OK
                            ) {
                                return;
                            }

                            try {

                                await this._deactivateOthers(
                                    oPolicy
                                );

                                oPolicy.context.setProperty(
                                    "isActive",
                                    true
                                );

                                await this.getView()
                                    .getModel()
                                    .submitBatch("$auto");

                                MessageToast.show(
                                    "Policy activated successfully."
                                );

                                await this._loadPolicies();

                            } catch (oError) {

                                console.error(
                                    "Activation failed:",
                                    oError
                                );

                                MessageBox.error(
                                    "Unable to activate policy."
                                );
                            }

                        }.bind(this)
                    }
                );
            },

            /* =========================
             * DEACTIVATE
             * ========================= */

            onDeactivatePolicy: function (oEvent) {

                const oPolicy =
                    oEvent.getSource()
                        .getBindingContext("policy")
                        .getObject();

                MessageBox.confirm(
                    "Deactivate '" +
                    oPolicy.data.policyName +
                    "'?",
                    {
                        title: "Deactivate Policy",

                        onClose: async function (sAction) {

                            if (
                                sAction !==
                                MessageBox.Action.OK
                            ) {
                                return;
                            }

                            try {

                                oPolicy.context.setProperty(
                                    "isActive",
                                    false
                                );

                                await this.getView()
                                    .getModel()
                                    .submitBatch("$auto");

                                MessageToast.show(
                                    "Policy deactivated successfully."
                                );

                                await this._loadPolicies();

                            } catch (oError) {

                                console.error(
                                    "Deactivation failed:",
                                    oError
                                );

                                MessageBox.error(
                                    "Unable to deactivate policy."
                                );
                            }

                        }.bind(this)
                    }
                );
            },

            /* =========================
             * STATUS
             * ========================= */

            formatStatus: function (bActive) {
                return bActive === true
                    ? "ACTIVE — CURRENTLY USED"
                    : "INACTIVE";
            },

            formatStatusState: function (bActive) {
                return bActive === true
                    ? "Success"
                    : "None";
            },

            onNavBack: function () {
                this._router.navTo("RouteMain");
            }
        }
    );
});