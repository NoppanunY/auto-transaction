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
    var fragment = document.createDocumentFragment();
    var headingEl = document.createElement('h3');
    var messageEl = document.createElement('p');

    messageEl.classList.add('plugin-space-message');
    messageEl.textContent = config.message;
    headingEl.classList.add('plugin-space-heading');
    headingEl.textContent = 'Hello kintone plugin!';

    fragment.appendChild(headingEl);
    fragment.appendChild(messageEl);
    spaceElement.appendChild(fragment);
  });

  kintone.events.on('app.record.create.submit.success', function(event){
    var record = event.record;
    console.log(record);
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    
    var field = JSON.parse(config.mapping);
    
    var recordsFields = {};

    recordsFields['id'] = {'value': kintone.app.getId().toString() + record['$id']['value'].toString()}
    recordsFields['status'] = {'value': "IN"}
    recordsFields['app_id'] = {'value': kintone.app.getId()}
    recordsFields['ref_record_no'] = {'value': record['$id']['value']}
    field.forEach(element => {
      console.log(record[element.from]);
      if(record[element.from] !== undefined){
        recordsFields[element.to] = {
          'value' : record[element.from]['value']
        };
      }
    });

    var body = {
      'app': config.destID,
      'record': recordsFields
    };

    console.log(body)
    
    kintone.api(kintone.api.url('/k/v1/record', true), 'POST', body, function(resp) {
      // success
      console.log(resp);
    }, function(error) {
      // error
      console.log(error);
    });

  });

  kintone.events.on('app.record.edit.submit.success', function(event){
    var record = event.record;
    console.log(record);
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    
    var field = JSON.parse(config.mapping);
    
    var recordsFields = {};

    recordsFields['status'] = {'value': "Adjustment"}
    recordsFields['app_id'] = {'value': kintone.app.getId()}
    field.forEach(element => {
      console.log(record[element.from]);
      if(record[element.from] !== undefined){
        recordsFields[element.to] = {
          'value' : record[element.from]['value']
        };
      }
    });

    var body = {
      'app': config.destID,
      'updateKey': {
        'field': 'id',
        'value': kintone.app.getId().toString() + record['$id']['value'].toString()
      },
      'record': recordsFields
    };

    console.log(body)
    
    kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', body, function(resp) {
      // success
      console.log(resp);
    }, function(error) {
      // error
      console.log(error);
    });

  });

  kintone.events.on('app.record.detail.delete.submit', function(event){
    var record = event.record;
    console.log(record);
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    
    var field = JSON.parse(config.mapping);
    
    var recordsFields = {};

    recordsFields['status'] = {'value': "OUT"}
    recordsFields['app_id'] = {'value': kintone.app.getId()}
    field.forEach(element => {
      console.log(record[element.from]);
      if(record[element.from] !== undefined){
        recordsFields[element.to] = {
          'value' : record[element.from]['value']
        };
      }
    });

    var body = {
      'app': config.destID,
      'updateKey': {
        'field': 'id',
        'value': kintone.app.getId().toString() + record['$id']['value'].toString()
      },
      'record': recordsFields
    };

    console.log(body)
    
    kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', body, function(resp) {
      // success
      console.log(resp);
    }, function(error) {
      // error
      console.log(error);
    });

  });

})(jQuery, kintone.$PLUGIN_ID);
