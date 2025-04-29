sap.ui.define([
    "sap/ui/core/Messaging",
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
    "sap/ui/model/json/JSONModel"
], (Messaging, Controller, MessageToast, MessageBox, Sorter, Filter, FilterOperator, FilterType, JSONModel) => {
    'use strict';

    return Controller.extend('tutorial.odatav4.controller.App', {
        onInit() {
            let oMessageModel = Messaging.getMessageModel(),
                oMessageModelBinding = oMessageModel.bindList('/', undefined, [], new Filter("technical", FilterOperator.EQ, true)),
                oModel = new JSONModel({
                    busy: false,
                    hasUIChanges: false,
                    usernameEmpty: false,
                    order: 0
                });

            this.getView().setModel(oModel, "appView");
            this.getView().setModel(oMessageModel, "message");

            oMessageModelBinding.attachChange(this.onMessageBindingChange, this);
            this._bTechnicalErrors = false
        },

        onMessageBindingChange(oEvent) {
            let aContexts = oEvent.getSource().getCurrentContexts(),
                aMessages,
                bMessageOpen = false;

            if (bMessageOpen || !aContexts.length) {
                return;
            }

            aMessages = aContexts.map(oContext => oContext.getObject());
            // sap.ui.getCore().getMessageManager().removeMessages(aMessages);
            Messaging.removeMessages(aMessages);

            this._setUIChanges(true);
            this._bTechnicalErrors = true;
            MessageBox.error(aMessages[0].message, {
                id: "serviceErrorMessageBox",
                onClose: function () {
                    bMessageOpen = false;
                }
            });

            bMessageOpen = true;
        },

        onRefresh() {
            var oBinding = this.byId('peopleList').getBinding('items');

            if (oBinding.hasPendingChanges()) {
                MessageBox.error(this._getText('refreshNotPossibleMessage'));
            }
            oBinding.refresh();
            MessageToast.show(this._getText('refreshSuccessMessage'));
        },

        onSearch() {
            let oView = this.getView(),
                sValue = oView.byId('searchField').getValue(),
                oFilter = new Filter('LastName', FilterOperator.Contains, sValue);

            oView.byId('peopleList').getBinding('items').filter(oFilter, FilterType.Application);
        },

        onSort() {
            let oView = this.getView(),
                aStates = [undefined, 'asc', 'desc'],
                aStateTextIds = ['sortNone', 'sortAscending', 'sortDescending'],
                sMessage,
                iOrder = oView.getModel('appView').getProperty('/order');

            iOrder = (iOrder + 1) % aStates.length;
            let sOrder = aStates[iOrder];

            oView.getModel('appView').setProperty('/order', iOrder);
            oView.byId('peopleList').getBinding('items').sort(sOrder && new Sorter('LastName', sOrder === 'desc'));

            sMessage = this._getText('sortMessage', [this._getText(aStateTextIds[iOrder])]);
            MessageToast.show(sMessage);
        },

        onCreate() {
            let oList = this.byId("peopleList"),
                oBinding = oList.getBinding("items"),
                oContext = oBinding.create({
                    "UserName": "",
                    "FirstName": "",
                    "LastName": "",
                    "Age": "18"
                });

            this._setUIChanges();
            this.getView().getModel("appView").setProperty("/usernameEmpty", true);

            oList.getItems().some(function (oItem) {
                if (oItem.getBindingContext() === oContext) {
                    oItem.focus();
                    oItem.setSelected(true);

                    return true;
                }
            })
        },

        onSave() {
            let fnSuccess = () => {
                this._setBusy(false);
                MessageToast.show(this._getText("changesSentMessage"));
                this._setUIChanges(false);
            },
                fnError = (oError) => {
                    this._setBusy(false);
                    this._setUIChanges(false);
                    MessageBox.error(oError.message);
                };

            this._setBusy(true); // Lock UI until submitBatch is resolved
            this.getView().getModel().submitBatch("peopleGroup").then(fnSuccess, fnError);
            this._bTechnicalErrors = false; // If there were techinal errors, a new save resets them
        },

        onResetChanges() {
            this.byId("peopleList").getBinding("items").resetChanges();
            this._bTechnicalErrors = false;
            this._setUIChanges();
        },

        onInputChange(oEvt) {
            if (oEvt.getParameter("escPressed")) {
                return this._setUIChanges();
            }

            this._setUIChanges(true);
            if (oEvt.getSource().getParent().getBindingContext().getProperty("UserName")) {
                this.getView().getModel("appView").setProperty("/usernameEmpty", false);
            }
        },

        async onDelete() {
            let oContext,
                oSelected = this.byId("peopleList").getSelectedItem(),
                sUserName;

            if (!oSelected) {
                return;
            }



            oContext = oSelected.getBindingContext();
            sUserName = oContext.getProperty("UserName");

            try {
                oContext.delete()
                await oContext.getModel().submitBatch('peopleGroup')
                MessageToast.show(this._getText("deletionSuccessMessage", [sUserName]));
            } catch (oError) {
                this._setUIChanges();
                if (oError.canceled) {
                    MessageToast.show(this._getText("deletionRestoredMessage", [sUserName]));
                    return;
                }

                MessageBox.error(oError.message + ": " + sUserName);
            }

            this._setUIChanges(true);
        },

        async onResetDataSource() {
            let oModel = this.getView().getModel(),
                oOperation = oModel.bindContext("/ResetDataSource(...)");

            try {
                await oOperation.invoke()
                await oModel.refresh();
                MessageToast.show(this._getText("sourceResetSuccessMessage"));
            } catch (oError) {
                MessageBox.error(oError.message);
            }
        },

        /**
         * Get text from i18n model
         * @param {string} sTextId - The text ID in i18n
         * @param {string[]} [aArgs] - Optional arguments for placeholders
         * @returns {string} The translated text
         */
        _getText(sTextId, aArgs) {
            return this.getOwnerComponent().getModel('i18n').getResourceBundle().getText(sTextId, aArgs);
        },

        _setUIChanges(bHasUIChanges) {
            if (this._bTechnicalErrors) {
                // if there is currently a techincal error, then force 'true'
                bHasUIChanges = true;
            } else if (bHasUIChanges === undefined) {
                bHasUIChanges = this.getView().getModel().hasPendingChanges();
            }

            let oModel = this.getView().getModel("appView");
            oModel.setProperty("/hasUIChanges", bHasUIChanges);
        },

        _setBusy(bIsBusy) {
            let oModel = this.getView().getModel("appView");
            oModel.setProperty("/busy", bIsBusy);
        }
    })
});