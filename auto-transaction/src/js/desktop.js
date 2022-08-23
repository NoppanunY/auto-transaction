jQuery.noConflict();

(function($, PLUGIN_ID) {
  'use strict';

  kintone.events.on('app.record.index.show', function() {
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    console.log(config);

    var spaceElement = kintone.app.getHeaderSpaceElement();
    if (spaceElement === null) {
      throw new Error('The header element is unavailable on this page');
    }
    // var fragment = document.createDocumentFragment();
    // var headingEl = document.createElement('h3');
    // var messageEl = document.createElement('p');

    // messageEl.classList.add('plugin-space-message');
    // messageEl.textContent = config.message;
    // headingEl.classList.add('plugin-space-heading');
    // headingEl.textContent = 'Hello kintone plugin!';

    // fragment.appendChild(headingEl);
    // fragment.appendChild(messageEl);
    // spaceElement.appendChild(fragment);
  });

  kintone.events.on('app.record.create.submit.success', function(event){
    var record = event.record;
    console.log(record);
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    
    var field = JSON.parse(config.fieldinfos);
    
    var recordsFields = {};

    recordsFields[config.uniqueField] = {'value': kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0')}
    recordsFields['io_type'] = {'value': "IN"}
    field.forEach(element => {
        recordsFields[element.target] = {
          'value' : element['source']['type']=='select' ? record[element['source']['value']]['value'] : element['source']['value']
        };
    });
    
    kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
      'app': config.targetID,
      'record': recordsFields
    }, function(resp) {
      console.log(resp);
    }, function(error) { });

  });

  kintone.events.on('app.record.edit.submit.success', function(event){
    var record = event.record;
    console.log(record);
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    console.log(config)
    var field = JSON.parse(config.fieldinfos);
    
    var recordsFields = {};

    recordsFields['io_type'] = {'value': "Adjustment"}
    field.forEach(element => {
      recordsFields[element.target] = {
        'value' : element['source']['type']=='select' ? record[element['source']['value']]['value'] : element['source']['value']
      };
    });

    var body = {
      'app': config.targetID,
      'updateKey': {
        'field': config.uniqueField,
        'value': kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0')
      },
      'record': recordsFields
    };

    console.log(body)
    
    kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', body, function(resp) {
      // success
      console.log(resp);
    }, function(error) { });

  });

  kintone.events.on('app.record.detail.delete.submit', function(event){
    var record = event.record;
    console.log(record);
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    
    var field = JSON.parse(config.fieldinfos);
    
    var recordsFields = {};

    recordsFields['io_type'] = {'value': "OUT"}
    field.forEach(element => {
      recordsFields[element.target] = {
        'value' : element['source']['type']=='select' ? record[element['source']['value']]['value'] : element['source']['value']
      };
    });

    var body = {
      'app': config.targetID,
      'updateKey': {
        'field': config.uniqueField,
        'value': kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0')
      },
      'record': recordsFields
    };

    console.log(body)
    
    kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', body, function(resp) {
      // success
      console.log(resp);
    }, function(error) { });

  });

})(jQuery, kintone.$PLUGIN_ID);
