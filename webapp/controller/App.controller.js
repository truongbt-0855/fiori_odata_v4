sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    'use strict';

    return Controller.extend('tutorial.odatav4.controller.App', {
        onInit() {
            var oJSONData = {
                busy : false
            },
            oModel = new JSONModel(oJSONData);

        this.getView().setModel(oModel, "appView");
        }
    })
});