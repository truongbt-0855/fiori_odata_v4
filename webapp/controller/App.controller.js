sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
    "sap/ui/model/json/JSONModel"
], (Controller, MessageToast, MessageBox, Sorter, Filter, FilterOperator, FilterType, JSONModel) => {
    'use strict';

    return Controller.extend('tutorial.odatav4.controller.App', {
        onInit() {
            let oJSONData = {
                busy: false,
                order: 0
            };
            let oModel = new JSONModel(oJSONData);

            this.getView().setModel(oModel, "appView");
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

        /**
         * Get text from i18n model
         * @param {string} sTextId - The text ID in i18n
         * @param {string[]} [aArgs] - Optional arguments for placeholders
         * @returns {string} The translated text
         */
        _getText(sTextId, aArgs = []) {
            return this.getOwnerComponent().getModel('i18n').getResourceBundle().getText(sTextId, aArgs);
        }
    })
});