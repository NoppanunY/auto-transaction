jQuery.noConflict();

(function($, PLUGIN_ID) {
  'use strict';

  var old_subtable = [];

  var isProceed = false;

  kintone.events.on('app.record.index.show', function() {
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    console.log(config);

    var spaceElement = kintone.app.getHeaderSpaceElement();
    if (spaceElement === null) {
      throw new Error('The header element is unavailable on this page');
    }
  });

  kintone.events.on('app.record.create.submit.success', function(event){
    var record = event.record;
    // console.log(record);
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    // console.log(config);
    var cond = JSON.parse(config.conditions);

    var json = JSON.parse(config.fieldinfos);
    // console.log(json)

    var checkCond = false;
    var records = [];
    var recordsFields = {};

    // recordsFields['io_type'] = {'value': "IN"}
    
    let subtableGroup = "";

    cond.forEach(element => {
      if(element.field in record){
        switch(element.operator){
          case "=":
            if(record[element.field]['value'] == element.value){
              checkCond = true;
            }
            break;
          case "<>":
            if(record[element.field]['value'] != element.value){
              checkCond = true;
            }
            break;
          case ">=":
            if(record[element.field]['value'] >= element.value){
              checkCond = true;
            }
            break;
          case "<=":
            if(record[element.field]['value'] <= element.value){
              checkCond = true;
            }
            break;
        }
      }
    });

    if(checkCond){
      recordsFields[config.uniqueField] = {'value': kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0')}
      // recordsFields['io_type'] = {'value': "IN"}
      json.forEach(element => {
        if(element['source']['type'] == 'subtable'){
          subtableGroup = element['source']['value']['group'];
        }
        recordsFields[element['target']['value']] = {
          'value' : element['source']['type']=='select' ? record[element['source']['value']]['value'] : element['source']['value']
        };
      });
      
      if(subtableGroup != ""){      
        record[subtableGroup]['value'].forEach(element => {
          console.log(element);
          recordsFields[config.uniqueField] = {
            'value': kintone.app.getId().toString().padStart(3, '0') + "-" + 
                    record['$id']['value'].toString().padStart(4, '0') + "-" + 
                    element['id'].toString().padStart(4, '0')
          }
          json.forEach(field => {
            if(field['source']['type'] == 'subtable'){
              recordsFields[field['target']['value']] = {
                'value': element['value'][field['source']['value']['value']]['value']
              }
            }
          });
          kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
            'app': config.targetID,
            'record': recordsFields
          }, function(resp) { console.log(resp) }, function(error) { console.log(error) });
        });

      }else{
        kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
          'app': config.targetID,
          'record': recordsFields
        });
      }
    }
  });

  kintone.events.on('app.record.edit.show', function(event){
    var record = event.record;
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    let subtableGroup = "";
    
    console.log(record);

    if(config.hasSubtable == 'true'){
      old_subtable = []
      var json = JSON.parse(config.fieldinfos);
      json.forEach(element => {
        if(element['source']['type'] == 'subtable'){
          subtableGroup = element['source']['value']['group'];
          // old_subtable.push({
          //   'group': element['source']['value']['group'],
          //   'value': element['source']['value']['value']
          // })
        }
      });

      record[subtableGroup]['value'].forEach(element => {
        let records = {};
        console.log(element);
        records['id'] = element['id'];
        json.forEach(field => {
          if(field['source']['type'] == 'subtable'){
            records[field['target']['value']] = {
              'value': element['value'][field['source']['value']['value']]['value']
            }
          }
        });
        old_subtable.push({
          records
        })
      });
    }
    console.log(old_subtable)
  });

  kintone.events.on('app.record.edit.submit.success', async function(event){
    var record = event.record;
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    var json = JSON.parse(config.fieldinfos);
    var cond = JSON.parse(config.conditions);
    
    var recordsFields = {};
    let subtableGroup = "";
    var checkCond = false;

    // console.log(record)
    cond.forEach(element => {
      if(element.field in record){
        switch(element.operator){
          case "=":
            if(record[element.field]['value'] == element.value){
              checkCond = true;
            }
            break;
          case "<>":
            if(record[element.field]['value'] != element.value){
              checkCond = true;
            }
            break;
          case ">=":
            if(record[element.field]['value'] >= element.value){
              checkCond = true;
            }
            break;
          case "<=":
            if(record[element.field]['value'] <= element.value){
              checkCond = true;
            }
            break;
        }
      }
    });

    if(checkCond){
      json.forEach(element => {
        if(element['source']['type'] == 'subtable'){
          subtableGroup = element['source']['value']['group'];
        }
        recordsFields[element['target']['value']] = {
          'value' : element['source']['type']=='select' ? record[element['source']['value']]['value'] : element['source']['value']
        };
      });
      
      if(subtableGroup != ""){      
        old_subtable.forEach(rold => {
          let isExist = false;
            record[subtableGroup]['value'].forEach(rnew => {
              console.log(rnew)
              console.log(rold)
              if(rnew['id'] == rold['records']['id']){
                isExist = true;
              }
            });
            if(!isExist){
              kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
                'app': config.targetID,
                'query': `${config.uniqueField} in ("${kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0') + "-" + rold['records']['id'].toString().padStart(4, '0')}")`,
                'fields': ['$id']
              }).then((res) => {
                if(res['records'].length > 0){
                  kintone.api(kintone.api.url('/k/v1/records', true), 'DELETE', {
                    'app': config.targetID,
                    'ids': [res['records'][0]['$id']['value']]
                  }).then((delete_res) => {
                    console.log("Delete", res['records'][0]);
                  });
                }
              });   
            }     
        })

        record[subtableGroup]['value'].forEach(async (element) => {
          let recordField = await getRecord(json, element, record);
          recordField[config.uniqueField] = {
            'value': kintone.app.getId().toString().padStart(3, '0') + "-" + 
                    record['$id']['value'].toString().padStart(4, '0') + "-" + 
                    element['id'].toString().padStart(4, '0')
          }
          
          kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
            'app': config.targetID,
            'query': `${config.uniqueField} in ("${kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0') + "-" + element['id'].toString().padStart(4, '0')}")`,
            'fields': ['$id']
          }).then((resp) => {
            console.log(resp);
            if(resp['records'].length == 0){
              kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
                'app': config.targetID,
                'record': recordField
              });
            }else{
              delete recordField[config.uniqueField];
              kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
                'app': config.targetID,
                'updateKey': {
                  'field': config.uniqueField,
                  'value': kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0') + "-" + element['id'].toString().padStart(4, '0')
                },
                'record': recordField
              });
            }
          });  
        });

      }else{
        kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
          'app': config.targetID,
          'updateKey': {
            'field': config.uniqueField,
            'value': kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0')
          },
          'record': recordsFields
        });
      }
    }
  });


  kintone.events.on('app.record.detail.show', function(event){
    var record = event.record;
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    var json = JSON.parse(config.fieldinfos);
    var cond = JSON.parse(config.conditions);
    
    var recordsFields = {};
    let subtableGroup = "";
    var checkCond = false;

    console.log(record);

    if(isProceed){
      console.log("Update");
      if(config.hasSubtable == 'true'){
        old_subtable = []
        var json = JSON.parse(config.fieldinfos);
        json.forEach(element => {
          if(element['source']['type'] == 'subtable'){
            subtableGroup = element['source']['value']['group'];
            // old_subtable.push({
            //   'group': element['source']['value']['group'],
            //   'value': element['source']['value']['value']
            // })
          }
        });
  
        record[subtableGroup]['value'].forEach(element => {
          let records = {};
          records['id'] = element['id'];
          json.forEach(field => {
            if(field['source']['type'] == 'subtable'){
              records[field['target']['value']] = {
                'value': element['value'][field['source']['value']['value']]['value']
              }
            }
          });
          old_subtable.push({
            records
          })
        });
      }

      console.log(record)
      cond.forEach(element => {
        if(element.field in record){
          switch(element.operator){
            case "=":
              if(record[element.field]['value'] == element.value){
                checkCond = true;
              }
              break;
            case "<>":
              if(record[element.field]['value'] != element.value){
                checkCond = true;
              }
              break;
            case ">=":
              if(record[element.field]['value'] >= element.value){
                checkCond = true;
              }
              break;
            case "<=":
              if(record[element.field]['value'] <= element.value){
                checkCond = true;
              }
              break;
          }
        }
      });

      if(checkCond){
        json.forEach(element => {
          if(element['source']['type'] == 'subtable'){
            subtableGroup = element['source']['value']['group'];
          }
          recordsFields[element['target']['value']] = {
            'value' : element['source']['type']=='select' ? record[element['source']['value']]['value'] : element['source']['value']
          };
        });
        
        if(subtableGroup != ""){      
          old_subtable.forEach(rold => {
            let isExist = false;
              record[subtableGroup]['value'].forEach(rnew => {
                console.log(rnew)
                console.log(rold)
                if(rnew['id'] == rold['records']['id']){
                  isExist = true;
                }
              });
              if(!isExist){
                kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
                  'app': config.targetID,
                  'query': `${config.uniqueField} in ("${kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0') + "-" + rold['records']['id'].toString().padStart(4, '0')}")`,
                  'fields': ['$id']
                }).then((res) => {
                  if(res['records'].length > 0){
                    kintone.api(kintone.api.url('/k/v1/records', true), 'DELETE', {
                      'app': config.targetID,
                      'ids': [res['records'][0]['$id']['value']]
                    }).then((delete_res) => {
                      console.log("Delete", res['records'][0]);
                    });
                  }
                });   
              }     
          })

          record[subtableGroup]['value'].forEach(async (element) => {
            let recordField = await getRecord(json, element, record);
            recordField[config.uniqueField] = {
              'value': kintone.app.getId().toString().padStart(3, '0') + "-" + 
                      record['$id']['value'].toString().padStart(4, '0') + "-" + 
                      element['id'].toString().padStart(4, '0')
            }
            
            kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
              'app': config.targetID,
              'query': `${config.uniqueField} in ("${kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0') + "-" + element['id'].toString().padStart(4, '0')}")`,
              'fields': ['$id']
            }).then((resp) => {
              console.log(resp);
              if(resp['records'].length == 0){
                kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
                  'app': config.targetID,
                  'record': recordField
                });
              }else{
                delete recordField[config.uniqueField];
                kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
                  'app': config.targetID,
                  'updateKey': {
                    'field': config.uniqueField,
                    'value': kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0') + "-" + element['id'].toString().padStart(4, '0')
                  },
                  'record': recordField
                });
              }
            });  
          });

        }else{
          kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
            'app': config.targetID,
            'updateKey': {
              'field': config.uniqueField,
              'value': kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0')
            },
            'record': recordsFields
          });
        }
      }
    }
  });

  kintone.events.on('app.record.detail.process.proceed', async function(event){
    var record = event.record;
    console.log(record);
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    var json = JSON.parse(config.fieldinfos);
    var cond = JSON.parse(config.conditions);
    
    var recordsFields = {};
    let subtableGroup = "";
    var checkCond = false;
    isProceed = true;
    
  });


  function getRecord(json, element, record){
    let recordsFields = {};
    return new Promise((resolve) => {
      json.forEach(field => {
        if(field['source']['type'] == 'subtable'){
          recordsFields[field['target']['value']] = {
            'value': element['value'][field['source']['value']['value']]['value']
          }
        }else{
          recordsFields[field['target']['value']] = {
            'value' : field['source']['type']=='select' ? record[field['source']['value']]['value'] : field['source']['value']
          };
        }
      });
 
      resolve(recordsFields);
    })
  }

  kintone.events.on('app.record.detail.delete.submit', function(event){
    var record = event.record;
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    var json = JSON.parse(config.fieldinfos);
    
    var query = `${config.uniqueField} like "${kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0')}"`;
    kintone.api(kintone.api.url('/k/v1/records', true) + '?app=' + config.targetID + '&query=' + query, 'GET', {}, function(resp) {
      console.log(resp)
      if(resp['records'].length > 0){
        resp.records.forEach(element => {
          kintone.api(kintone.api.url('/k/v1/records', true), 'DELETE', {
            'app': config.targetID,
            'ids': [element['$id']['value']]
          }).then((delete_res) => {
            console.log("Delete", element['$id']['value']);
          });
        })
      }
    });

  });

})(jQuery, kintone.$PLUGIN_ID);
