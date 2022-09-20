jQuery.noConflict();

(function($, PLUGIN_ID) {
  'use strict';
  luxon.Settings.defaultLocale = 'en-US'; // Sinitialize the locale

  // const
  const AppID = kintone.app.getId();

  var old_subtable = [];

  var isProceed = false;

  var vars = {
    apps: {},
    source: {},
    target: {},
    setting: {
      reloaded: false
    }
  }

  function loadFields(ID){
    let fields = {
      fieldinfos: {},
      hasUnique: false
    }
    return new Promise ((resolve) => {
      kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', {
        'app': ID
      }).then(function(resp){
        $.each(resp.properties, function(index, value){
          fields['fieldinfos'][value.code] = value
          if(value.hasOwnProperty('unique')){
            fields['hasUnique'] = true;
          }
        });
        resolve(fields);
      });
    })
  }

  function checkCondition(cond, record){
    let check = false;
    cond.forEach(element => {
      if(element.field in record){
        switch(element.operator){
          case "=":
            if(record[element.field]['value'] == element.value){
              check = true;
            }
            break;
          case "<>":
            if(record[element.field]['value'] != element.value){
              check = true;
            }
            break;
          case ">=":
            if(record[element.field]['value'] >= element.value){
              check = true;
            }
            break;
          case "<=":
            if(record[element.field]['value'] <= element.value){
              check = true;
            }
            break;
        }
      }
    });

    return check;
  }

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
  
  async function updateSummary(config){
    // console.log(config);
    
    console.group("Update")
    
    let period = []
    let query = ""
    for(let p of config.period){
      period.push(
        `${p.source} = ${p.period}`
      );
    }
    query += period.join(" and ")
    var sourceRecords = await fetch_record(config.app.source, query);

    let filter = []

    if(sourceRecords.records.length == 0){
      await new Promise((resolve) => {
        kintone.api(kintone.api.url('/k/v1/records', true) + `?app${config.app.target}`, 'GET', {}, function(resp){
          let ids = []
          for(let record of resp.records){
            ids.push(record['$id']['value'])
          }
          kintone.api(kintone.api.url('/k/v1/records', true), 'DELTE', {
            'app': config.target,
            'ids': ids
          })
        });
      })

      return
    }

    for (let elm of sourceRecords.records) {
      
      // console.log(elm)
      let query_target = []
      let query_source = []
      let period = []
      let cond = {
        'plus': {},
        'minus': {}
      }
      let isExist = []
      let body = {
        'app': "",
        'record': {}
      }

      body['app'] = config.app.target
      
      for(let map of config.mapping){
        if(map.type != "DATE"){
          query_target.push(`${map.target} like "${elm[map.source]['value']}"`);
          query_source.push(`${map.source} like "${elm[map.source]['value']}"`);
          body['record'][map.target] = {'value' : elm[map.source]['value']}
        }else{
          query_target.push(`${map.target} = "${luxon.DateTime.fromISO(elm[map.source]['value']).toFormat(map.format)}"`);
          query_source.push(`${map.source} = "${elm[map.source]['value']}"`);
          
          body['record'][map.target] = {
            'value' : luxon.DateTime.fromISO(elm[map.source]['value']).toFormat(map.format)
          }

          // new Date(elm[map.source]['value']);
          // luxon.DateTime.fromISO(elm[map.source]['value']).toRelative();
          // luxon.DateTime.fromISO(elm[map.source]['value']).toFormat('MMMM dd, yyyy')
        }
        isExist.push(`${map.target} like "${elm[map.source]['value']}"`);
        
      }

      for(let p of config.period){
        period.push(
          `${p.source} = ${p.period}`
        );
      }

      for(let c of config.plus){
        if(c.target in cond){
          cond['plus'][c.target].push(c.cond)
        }else{
          cond['plus'][c.target] = [c.cond]
        }
      }

      for(let c of config.minus){
        if(c.target in cond){
          cond['minus'][c.target].push(c.cond)
        }else{
          cond['minus'][c.target] = [c.cond]
        }
      }

      if(!filter.includes(isExist.join(" and "))){
        // PLUS
        let query_str = query_source.join(" and ")
        let c = []
        for(const [key, value] of Object.entries(cond.plus)){
          c.push(`${key} in (${value.map(v => `"${v}"`).join(", ") })`)
        }
        query_str += " and " + c.join(" and ")
        query_str += " and " + period.join(" and ")
        let plus_total = await calc_summary(config.app.source ,query_str , config.summary.source, {'plus': config.plus, 'minus': config.minus});
        
        // MINUS
        query_str = query_source.join(" and ")
        c = []
        for(const [key, value] of Object.entries(cond.minus)){
          c.push(`${key} in (${value.map(v => `"${v}"`).join(", ") })`)
        }
        query_str += " and " + c.join(" and ")
        query_str += " and " + period.join(" and ")
        let minus_total = await calc_summary(config.app.source ,query_str , config.summary.source, {'plus': config.plus, 'minus': config.minus});
        
        // console.log(plus_total)
        // console.log(minus_total)
        
        body['record'][config.summary.target] = {'value' : plus_total-minus_total};

        console.table(body['record'])

        kintone.api(kintone.api.url('/k/v1/records', true) + `?app=${config.app.target}&query=${query_target.join(" and ")}` , 'GET', {}, function(resp){
          if(resp.records.length == 0){
            kintone.api(kintone.api.url('/k/v1/record', true), 'POST', body, function(resp){
              // console.log()
            })
          }else{
            body['id'] = resp.records[0]['$id']['value']
            kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', body, function(resp){
              // console.log()
            })
          }
        })

        filter.push(isExist.join(" and "))
        // console.log(filter)
        // console.log(plus_total-minus_total)
      }
    }
    console.log("Finish")
    console.groupEnd()
  }
  
  function calc_summary(appID, query, field, cond) {
    return new Promise((resolve) => {
        // var AppID = AppID_Transaction;

        // console.log(appID, query, field)
        console.group("Calc")
        // console.log(cond);

        kintone.api(kintone.api.url('/k/v1/records', true) + `?app=${appID}&query=${query}`, 'GET', {},  function(resp) {
          // success
          var total = 0;
          console.log(resp)
          // console.log(resp.records[0]['item_code']['value'])
          for (const record of resp.records) {            
            total += parseFloat(record[field]['value'])
          }
          resolve(total)
          console.groupEnd();
        }, function(error) {
          // error
          console.log(error);
        });
    })
  }

  function fetch_record(appID, query) {
    return new Promise((resolve) => {
      console.group("Fetch")
      kintone.api(kintone.api.url('/k/v1/records', true) + `?app=${appID}&query=${query}`, 'GET', {}, function(resp){
        console.log(resp)
        console.groupEnd()
        resolve(resp)
      });
    })
  }

  function fetch(tentId, AppID, fields ,opt_offset, opt_records) {
    var offset = opt_offset || 0;
    var records = opt_records || [];
    var params = {
      app: AppID,
      query: 'tentId in ("' + tentId + '") limit 500 offset ' + offset,
      fields: fields
    };
    return kintone.api('/k/v1/records', 'GET', params).then(function(resp) {
      records = records.concat(resp.records);
      if (resp.records.length === 500) {
        return fetch(tentId, AppID, fields, offset + 500, records);
      }
      return records;
    });
  }

  $(document).ready(async function(){
    /*---------------------------------------------------------------
    initialize fields
    ---------------------------------------------------------------*/
    vars['source'] = await loadFields(AppID);
  });

  kintone.events.on('app.record.index.show', function() {
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    // console.log(config);
    // console.log(JSON.parse(config.fieldinfos));
    console.log(JSON.parse(config.summary));

    var spaceElement = kintone.app.getHeaderSpaceElement();
    if (spaceElement === null) {
      throw new Error('The header element is unavailable on this page');
    }
  });

  kintone.events.on('app.record.create.submit.success', async function(event){
    var record = event.record;
    // console.log(record);
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    // console.log(config);
    var cond = JSON.parse(config.conditions);

    var json = JSON.parse(config.fieldinfos);
    // console.log(json)

    var records = [];
    var recordsFields = {};
    
    let subtableGroup = "";

    let checkCond = checkCondition(cond, record);

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
      
      console.group("Create");
      if(subtableGroup != ""){
        console.log("Start")
        for(let element of record[subtableGroup]['value']){
          recordsFields[config.uniqueField] = {
            'value': kintone.app.getId().toString().padStart(3, '0') + "-" + 
                    record['$id']['value'].toString().padStart(4, '0') + "-" + 
                    element['id'].toString().padStart(4, '0')
          }
          for(let field of json){
            if(field['source']['type'] == 'subtable'){
              recordsFields[field['target']['value']] = {
                'value': element['value'][field['source']['value']['value']]['value']
              }
            }
          }
          // console.table(recordsFields)
          await new Promise((resolve, reject) => {
            kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
              'app': config.targetID, 
              'record': recordsFields
            }, function(resp){
              console.log(resp)
              resolve(resp)
            }, function(error){
              reject(error)
            });
          })
        }
        console.log("End")
        
        await updateSummary(JSON.parse(config.summary));
      }else{
        await new Promise((resolve) => {
          kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
            'app': config.targetID,
            'record': recordsFields
          }, function(resp){
            resolve(resp)
          });
        })
       
        await updateSummary(JSON.parse(config.summary));
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

    let checkCond = checkCondition(cond, record);

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
        for(let rold of old_subtable){
        // old_subtable.forEach(rold => {
          let isExist = false;
            for(let rnew of record[subtableGroup]['value']){
            // record[subtableGroup]['value'].forEach(rnew => {
              console.log(rnew)
              console.log(rold)
              if(rnew['id'] == rold['records']['id']){
                isExist = true;
              }
            // });
            }
            
            if(!isExist){

              await new Promise((resolve) => {
                kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
                  'app': config.targetID,
                  'query': `${config.uniqueField} in ("${kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0') + "-" + rold['records']['id'].toString().padStart(4, '0')}")`,
                  'fields': ['$id']
                }).then((resp) => {
                  resolve(resp)
                });   
              }).then((resp) => {
                if(resp['records'].length > 0){
                  kintone.api(kintone.api.url('/k/v1/records', true), 'DELETE', {
                    'app': config.targetID,
                    'ids': [resp['records'][0]['$id']['value']]
                  }).then((delete_res) => {
                    console.log("Delete", resp['records'][0]);
                  });
                }
              })
            }     
        // })
        }

        for(let element of record[subtableGroup]['value']){
        // record[subtableGroup]['value'].forEach(async (element) => {
          let recordField = await getRecord(json, element, record);
          recordField[config.uniqueField] = {
            'value': kintone.app.getId().toString().padStart(3, '0') + "-" + 
                    record['$id']['value'].toString().padStart(4, '0') + "-" + 
                    element['id'].toString().padStart(4, '0')
          }
          
          await new Promise((resolve) => {
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
                }, function(resp){
                  resolve(resp)
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
                }, function(resp){
                  resolve(resp)
                });
              }
            });  
          })
        // });
        }

        await updateSummary(JSON.parse(config.summary));

      }else{
        kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
          'app': config.targetID,
          'updateKey': {
            'field': config.uniqueField,
            'value': kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0')
          },
          'record': recordsFields
        });

        await updateSummary(JSON.parse(config.summary));
      }
    }
  });

  kintone.events.on('app.record.detail.show',async function(event){
    var record = event.record;
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    var json = JSON.parse(config.fieldinfos);
    var cond = JSON.parse(config.conditions);
    
    var recordsFields = {};
    let subtableGroup = "";
    

    // console.log(record);

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

      var checkCond = checkCondition(cond, record);

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

          for(let element of record[subtableGroup]['value']){
          // record[subtableGroup]['value'].forEach(async (element) => {
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
          // });
          }

          await updateSummary(JSON.parse(config.summary));
        }else{
          kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
            'app': config.targetID,
            'updateKey': {
              'field': config.uniqueField,
              'value': kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0')
            },
            'record': recordsFields
          });

          await updateSummary(JSON.parse(config.summary));
        }
      }
    }
  });

  kintone.events.on('app.record.detail.process.proceed', async function(event){
    isProceed = true;
  });

  kintone.events.on(['app.record.detail.delete.submit', 'app.record.index.delete.submit'], function(event){
    var record = event.record;
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    var json = JSON.parse(config.fieldinfos);
    
    var query = `${config.uniqueField} like "${kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0')}"`;
    kintone.api(kintone.api.url('/k/v1/records', true) + `?app=${config.targetID}&query=` + query, 'GET', {},async function(resp) {
      console.log(resp)
      if(resp['records'].length > 0){
        for(let element of resp.records){
          await new Promise((resolve) => {
            kintone.api(kintone.api.url('/k/v1/records', true), 'DELETE', {
              'app': config.targetID,
              'ids': [element['$id']['value']]
            }).then((delete_res) => {
              console.log("Delete", element['$id']['value']);
              resolve(delete_res)
            });
          })
        }

        await updateSummary(JSON.parse(config.summary));
      }
    });

  });

})(jQuery, kintone.$PLUGIN_ID);
