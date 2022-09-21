jQuery.noConflict();

(function($, PLUGIN_ID) {
  'use strict';

  // const
  const AppID = kintone.app.getId();

  const cdnRequired = [
    {
      'platform': 'desktop',
      'lang': 'js',
      'type': 'URL',
      'url': 'https://js.kintone.com/luxon/3.0.3/luxon.min.js'
    },
    {
      'platform': 'desktop',
      'lang': 'js',
      'type': 'URL',
      'url': 'https://js.kintone.com/jquery/3.6.1/jquery.min.js'
    },
  ]
  
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


  function alertMessage(message) {
    var alertButtonClose = $('<span class="close"></span>'),
        alertMessage = $('<div class="kintoneplugin-alert popup"><span>' + message + '</span></div>');
    alertButtonClose.click(function() {
        $(this).parents('.kintoneplugin-alert-popup').remove();
        window.location.href = '/k/admin/app/flow?app=' + kintone.app.getId();
    });
    alertMessage.append(alertButtonClose);
    $('body').append($('<div class="kintoneplugin-alert-popup"></div>').append(alertMessage));
  }


  /**
   * กำหนดค่าเริ่มต้น plugin
  */
  async function settingPlugin(){    
    var body = {}
    var scope = ""
    let updated = false

    kintone.api(kintone.api.url('/k/v1/app/customize', true), 'GET', {
      'app': AppID
    },async function(resp) {
      
      body = resp
      
      for(let cdn of cdnRequired){
        let isExist = false
        for(let item of body[cdn.platform][cdn.lang]){
          if(item.type == "URL" && cdn.type == item.type){
            if(cdn.url == item.url) isExist = true
          }
        }
        if(!isExist){
          let text = `จำเป็นต้องใช้ cdn ${cdn.url}\nยืนยันเพื่อเพิ่มอัติโนมัติ`;
          if (confirm(text) == true) {
            text = "You pressed OK!";
            updated = true
            body[cdn.platform][cdn.lang].push({
              'type': cdn.type,
              'url': cdn.url
            })
          } else {
            alert("เกิดข้อผิดพลาด")
            return;
          }
        }
      }

      if(!updated){
        luxon.Settings.defaultLocale = 'en-US'; // Sinitialize the locale
        return
      }
      
      delete body['revision'];
      scope = body['scope'];
      delete body['scope'];

      for(var platform of Object.entries(body)){
        for(var lang of Object.entries(platform[1])){
          for(var index in lang[1]){
            let type = body[platform[0]][lang[0]][index].type;

            if(type != "FILE") continue

            let fileKey = body[platform[0]][lang[0]][index].file.fileKey
            let fileName = body[platform[0]][lang[0]][index].file.name
            let newFilekey = await fetchFile(fileKey, fileName)

            body[platform[0]][lang[0]][index].file.fileKey = newFilekey

            delete body[platform[0]][lang[0]][index].file.contentType
            delete body[platform[0]][lang[0]][index].file.name
            delete body[platform[0]][lang[0]][index].file.size
          }
        }
      }

      body['app'] = AppID;
      body['scope'] = scope;
      
      kintone.api(kintone.api.url('/k/v1/preview/app/customize', true), 'PUT', resp, function(resp) {
        alertMessage('The plug-in settings have been saved. Please update the app!');
      });
     
    });
  }


  /**
   * key renew
   * @param {string} fileKey old fileKey
   * @param {string} fileName file name
   * @returns new fileKey
   */
  function fetchFile(fileKey, fileName){
    return new Promise((resolve) => {
        var url = kintone.api.url('/k/v1/file.json', true) + "?fileKey=" + fileKey;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.responseType = 'blob';
        xhr.onload = function() {
          if (xhr.status === 200) {
            var blob = new Blob([xhr.response]);
            var formData = new FormData();
            formData.append('__REQUEST_TOKEN__', kintone.getRequestToken());
            formData.append('file', blob, fileName);

            var url = kintone.api.url('/k/v1/file.json', true);
            var new_xhr = new XMLHttpRequest();
            new_xhr.open('POST', url);
            new_xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            new_xhr.onload = function() {
              if (new_xhr.status === 200) {
                resolve(JSON.parse(new_xhr.responseText).fileKey)
              } else {
                console.log(JSON.parse(new_xhr.responseText));
              }
            };
            new_xhr.send(formData);

          } else {
            console.log(xhr.responseText);
          }
        };
        xhr.send();   
    })
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
    if(cond.length == 0){
      check = true
    }

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
  
  async function updateSummary(config, ids){
    // console.log(config);
    
    const b1 = performance.now();

    console.group("Update")
    
    let period = []
    let query = ""

    // ลูปแมพหาช่วงเวลาที่ต้องอัพเดท
    for(let p of config.period){
      period.push(
        `${p.source} = ${p.period}`
      );
    }
    query += period.join(" and ")

    if(ids.length > 0){
      query += ` and $id in (${ids.join(", ")})`
    }

    // ดึงทุกแถวที่อยู่ในช่วงเวลา
    var sourceRecords = await fetch_record(config.app.source, query);


    let filter = []


    // ถ้าข้อมูลใน transaction ถูกลบหมด ให้ลบของทั้งหมดใน summary
    if(sourceRecords.records.length == 0){
      // await new Promise((resolve) => {
      //   kintone.api(kintone.api.url('/k/v1/records', true) + `?app${config.app.target}`, 'GET', {}, function(resp){
      //     let ids = []
      //     for(let record of resp.records){
      //       ids.push(record['$id']['value'])
      //     }
      //     kintone.api(kintone.api.url('/k/v1/records', true), 'DELTE', {
      //       'app': config.app.target,
      //       'ids': ids
      //     })
      //   });
      // })

      return
    }


    let cond = {
      'plus': {},
      'minus': {}
    }

    // สร้างเงื่อนไข plus
    for(let plus of config.plus){
      if(plus.target in cond){
        cond['plus'][plus.target].push(plus.cond)
      }else{
        cond['plus'][plus.target] = [plus.cond]
      }
    }

    // สร้างเงื่อนไข minus
    for(let minus of config.minus){
      if(minus.target in cond){
        cond['minus'][minus.target].push(minus.cond)
      }else{
        cond['minus'][minus.target] = [minus.cond]
      }
    }
    
    // ลูปทุกแถวที่อยู่ในช่วงเวลา
    for (let elm of sourceRecords.records) {

      let query_target = []
      let query_source = []
      
      let isExist = []
      let body = {
        'app': "",
        'record': {}
      }

      // กำหนด id ปลายทาง
      body['app'] = config.app.target
      
      // ลูป mapping, grouping และสร้าง query string
      for(let map of config.mapping){
        if(map.type != "DATE"){
          query_target.push(`${map.target} = "${elm[map.source]['value']}"`);
          query_source.push(`${map.source} = "${elm[map.source]['value']}"`);
          body['record'][map.target] = {
            'value' : elm[map.source]['value']
          }
        }else{
          if(map.formet == ""){
            query_target.push(`${map.target} = "${elm[map.source]['value']}"`);
            query_source.push(`${map.source} = "${elm[map.source]['value']}"`);
            
            body['record'][map.target] = {
              'value' : elm[map.source]['value']
            }
          }else{
            query_target.push(`${map.target} = "${luxon.DateTime.fromISO(elm[map.source]['value']).toFormat(map.format)}"`);
            query_source.push(`${map.source} = "${elm[map.source]['value']}"`);
            
            body['record'][map.target] = {
              'value' : luxon.DateTime.fromISO(elm[map.source]['value']).toFormat(map.format)
            }
          }
        }
        // isExist.push(`${map.target} like "${elm[map.source]['value']}"`); 
      }

      // PLUS
      let query_str_plus = query_source.join(" and ")
      let foo = []
      for(const [key, value] of Object.entries(cond.plus)){
        foo.push(`${key} in (${value.map(v => `"${v}"`).join(", ") })`)
      }
      query_str_plus += " and " + foo.join(" and ")
      query_str_plus += " and " + period.join(" and ")

      // MINUS
      let query_str_minus = query_source.join(" and ")
      foo = []
      for(const [key, value] of Object.entries(cond.minus)){
        foo.push(`${key} in (${value.map(v => `"${v}"`).join(", ") })`)
      }
      query_str_minus += " and " + foo.join(" and ")
      query_str_minus += " and " + period.join(" and ")

      if(!filter.includes(query_str_plus) && !filter.includes(query_str_minus)){
        
        console.group("Plus")
        let plus_total = await calc_summary(config.app.source ,query_str_plus , config.summary.source, {'plus': config.plus, 'minus': config.minus});
        filter.push(query_str_plus)
        console.groupEnd()

        
        console.group("Minus")
        let minus_total = await calc_summary(config.app.source ,query_str_minus , config.summary.source, {'plus': config.plus, 'minus': config.minus});
        filter.push(query_str_minus)
        console.groupEnd()
        
        // Sum
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

        filter.push(query_str_plus)
        filter.push(query_str_minus)
        // console.log(filter)
        // console.log(plus_total-minus_total)
      }
    }

    const b2 = performance.now();
    console.log(`Time: ${b2 - b1}`);
    console.log("Finish")
    console.groupEnd()
  }

  async function isExistTransaction(config, record){
    // console.log(config);
    
    console.group("Check is exist")
    
    let period = []
    let query = ""

    let filter = []

    let insert_record = []
    let update_record = []

    let query_target = []
    let query_source = []
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
    
    // ลูป mapping, grouping และสร้าง query string
    for(let map of config.mapping){
      if(map.type != "DATE"){
        query_target.push(`${map.target} = "${record[map.source]['value']}"`);
        query_source.push(`${map.source} = "${record[map.source]['value']}"`);
        body['record'][map.target] = {'value' : record[map.source]['value']}
      }else{

        if(map.formet == ""){
          query_target.push(`${map.target} = "${record[map.source]['value']}"`);
          query_source.push(`${map.source} = "${record[map.source]['value']}"`);
          
          body['record'][map.target] = {
            'value' : elm[map.source]['value']
          }
        }else{
          query_target.push(`${map.target} = "${luxon.DateTime.fromISO(record[map.source]['value']).toFormat(map.format)}"`);
          query_source.push(`${map.source} = "${record[map.source]['value']}"`);
          
          body['record'][map.target] = {
            'value' : luxon.DateTime.fromISO(record[map.source]['value']).toFormat(map.format)
          }
        }

      }
      isExist.push(`${map.target} like "${record[map.source]['value']}"`);
      
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

      // เช็คตาราง transaction มีไหม
      let check = await new Promise((resolve) => {
        kintone.api(kintone.api.url('/k/v1/records', true) + `?app=${config.app.source}&query=${query_str}`, 'GET', {},  function(resp) {
          // success
          console.log(resp.records.length)
          if(resp.records.length == 0){
            resolve(true)
          }else{
            resolve(false)
          }
          
        }, function(error) {
          // error
          console.log(error);
        });
      })

      if(check){
        await new Promise((resolve, reject) => {
          kintone.api(kintone.api.url('/k/v1/records', true) + `?app=${config.app.target}&query=${query_target.join(" and ")}` , 'GET', {}, function(resp){
            if(resp.records.length > 0){
              console.table(resp.records[0])
              kintone.api(kintone.api.url('/k/v1/records', true), 'DELETE', {
                'app': config.app.target,
                'ids': [resp.records[0]['$id']['value']]
              }, function(resp){
                resolve()
              })
            }else{
              resolve()
            }
          })
        }) 
      }

      filter.push(isExist.join(" and "))
      // console.log(filter)
      // console.log(plus_total-minus_total)
    }

    console.log("Finish")
    console.groupEnd()
  }
  
  function calc_summary(appID, query, field, cond) {
    return new Promise((resolve) => {
        // var AppID = AppID_Transaction;

        // console.log(appID, query, field)
        console.group("Calc")
        console.log("App " + appID + " Query " + query)
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
      console.log("App " + appID + " Query " + query)
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
    settingPlugin()

    vars['source'] = await loadFields(AppID);
  });

  kintone.events.on('app.record.index.show', function() {
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
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

      // กำหนด key
      recordsFields[config.uniqueField] = {'value': kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0')}
      // recordsFields['io_type'] = {'value': "IN"}

      // วนลูปกำหนดค่าที่ไม่ใช่ subtable
      json.forEach(element => {

        // เก็บค่าชื่อ table group
        if(element['source']['type'] == 'subtable'){
          subtableGroup = element['source']['value']['group'];
        }

        // assign variable outside subtable
        recordsFields[element['target']['value']] = {
          // check is select or text
          'value' : element['source']['type']=='select' ? record[element['source']['value']]['value'] : element['source']['value']
        };
      });
      
      
      console.group("Create");
      let ids = []
      if(subtableGroup != ""){
        console.log("Start")

        // loop in subtable
        for(let element of record[subtableGroup]['value']){

          // define new key with record of suntable
          recordsFields[config.uniqueField] = {
            'value': kintone.app.getId().toString().padStart(3, '0') + "-" + 
                    record['$id']['value'].toString().padStart(4, '0') + "-" + 
                    element['id'].toString().padStart(4, '0')
          }

          // loop find subtable and mapping
          for(let field of json){
            if(field['source']['type'] == 'subtable'){
              recordsFields[field['target']['value']] = {
                'value': element['value'][field['source']['value']['value']]['value']
              }
            }
          }
          // console.table(recordsFields)
          
          // api POST 
          await new Promise((resolve, reject) => {
            kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
              'app': config.targetID, 
              'record': recordsFields
            }, function(resp){
              console.log(resp)
              ids.push(resp.id)
              resolve(resp)
            }, function(error){
              reject(error)
            });
          })
        }
        console.log("End")
        
        await updateSummary(JSON.parse(config.summary), ids);
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
    let ids = []

    let checkCond = checkCondition(cond, record);

    if(checkCond){

      // วนลูปกำหนดค่าที่ไม่ใช่ subtable
      json.forEach(element => {
        if(element['source']['type'] == 'subtable'){
          subtableGroup = element['source']['value']['group'];
        }
        recordsFields[element['target']['value']] = {
          'value' : element['source']['type']=='select' ? record[element['source']['value']]['value'] : element['source']['value']
        };
      });
      
      if(subtableGroup != ""){   

        // loop old subtable
        for(let rold of old_subtable){
        
            let isExist = false;
            // เช็คว่า มีแถวที่ถูกลบไหม
            for(let rnew of record[subtableGroup]['value']){
              console.log(rnew)
              console.log(rold)
              if(rnew['id'] == rold['records']['id']){
                isExist = true;
              }
            }
            
            // ถ้ามีแถวที่ถูกลบ ลบขแงเก่าออก
            if(!isExist){

              await new Promise((resolve) => {
                kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
                  'app': config.targetID,
                  'query': `${config.uniqueField} in ("${kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0') + "-" + rold['records']['id'].toString().padStart(4, '0')}")`,
                }).then((resp) => {
                  if(resp['records'].length > 0){
                    kintone.api(kintone.api.url('/k/v1/records', true), 'DELETE', {
                      'app': config.targetID,
                      'ids': [resp['records'][0]['$id']['value']]
                    }).then(async (delete_res) => {
                      console.log("Delete", resp['records'][0]);
                      await isExistTransaction(JSON.parse(config.summary), resp.records[0])
                      resolve(resp)
                    });
                  }
                });   
              })
            }     
        }

        // loop in subtable

        for(let element of record[subtableGroup]['value']){

          // เหมือนกับเพื่มเลย
          let recordField = await getRecord(json, element, record);

          // define new key with record of suntable
          recordField[config.uniqueField] = {
            'value': kintone.app.getId().toString().padStart(3, '0') + "-" + 
                    record['$id']['value'].toString().padStart(4, '0') + "-" + 
                    element['id'].toString().padStart(4, '0')
          }
          
          // เช็คว่าของเก่า id อะไร
          await new Promise((resolve) => {
            kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
              'app': config.targetID,
              'query': `${config.uniqueField} in ("${kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0') + "-" + element['id'].toString().padStart(4, '0')}")`,
            }).then((resp_1) => {
              console.log(resp_1);
              // ถ้าของเก่าไม่มีเพิ่มใหม่
              if(resp_1['records'].length == 0){
                kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
                  'app': config.targetID,
                  'record': recordField
                }, function(resp){
                  ids.push(resp.id)
                  resolve(resp)
                });
              }else{
                // ถ้าของเก่ามีแก้ของเก่า
                delete recordField[config.uniqueField];
                kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
                  'app': config.targetID,
                  'updateKey': {
                    'field': config.uniqueField,
                    'value': kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0') + "-" + element['id'].toString().padStart(4, '0')
                  },
                  'record': recordField
                },async function(resp){
                  console.log(resp_1)
                  await isExistTransaction(JSON.parse(config.summary), resp_1.records[0])
                  ids.push(resp_1.records[0]['$id']['value'])
                  resolve(resp)
                });
              }
            });  
          })
        }

        await updateSummary(JSON.parse(config.summary), ids);

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
    let ids = []

    // console.log(record);

    if(isProceed){
      console.group("Update with process");
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
                }).then((resp) => {
                  if(resp['records'].length > 0){
                    kintone.api(kintone.api.url('/k/v1/records', true), 'DELETE', {
                      'app': config.targetID,
                      'ids': [resp['records'][0]['$id']['value']]
                    }).then(async (delete_res) => {
                      await isExistTransaction(JSON.parse(config.summary), resp.records[0])
                      console.log("Delete", resp['records'][0]);
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
                    ids.push(resp.id)
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
                    ids.push(resp.id)
                    resolve(resp)
                  });
                }
              });  
            })
          // });
          }
          console.groupEnd()
          await updateSummary(JSON.parse(config.summary), ids);
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

  kintone.events.on(['app.record.detail.delete.submit', 'app.record.index.delete.submit'],async function(event){
    var record = event.record;
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    var json = JSON.parse(config.fieldinfos);
    
    var query = `${config.uniqueField} like "${kintone.app.getId().toString().padStart(3, '0') + "-" + record['$id']['value'].toString().padStart(4, '0')}"`;
    
    let ids = []

    // ลบแถวใน transaction
    await new Promise((resolve, reject) => {
      kintone.api(kintone.api.url('/k/v1/records', true) + `?app=${config.targetID}&query=` + query, 'GET', {},async function(resp) {
        console.log(resp)

        // ถ้ามีจะลูปจนหมด
        if(resp['records'].length > 0){
          for(let record of resp.records){
            await new Promise((resolve) => {
              kintone.api(kintone.api.url('/k/v1/records', true), 'DELETE', {
                'app': config.targetID,
                'ids': [record['$id']['value']]
              }).then(async (delete_res) => {
                // if(!isExistTransaction(JSON.parse(config.summary), record)){
  
                // }

                // เช็คว่า transaction หมดไหม ถ้าหมดจะลบออกเลย
                await isExistTransaction(JSON.parse(config.summary), record)
                console.log("Delete", record['$id']['value']);
                console.log(delete_res)
                // ids.push(record)
                resolve(delete_res)
              });
            })
          }
  
          await updateSummary(JSON.parse(config.summary)).then((result) => {
            console.log("Delete")
            resolve()
          });
        }
      });
    })

    console.log("Deleted")
    return event;

  });

})(jQuery, kintone.$PLUGIN_ID);
