jQuery.noConflict();

(function($, PLUGIN_ID) {
  'use strict';

  // const
  const AppID = kintone.app.getId();

  const ignoreField = ['id', 'status', 'app_id', 'ref_record_no'];

  const CONF = kintone.plugin.app.getConfig(PLUGIN_ID);
  
  if('summary' in CONF){
    CONF['summary'] = JSON.parse(kintone.plugin.app.getConfig(PLUGIN_ID)['summary']);
  }else{
    // CONF['summary'] = {
    //   'mapping': [],
    //   'period': [],
    //   'summaryList': []
    // }
  }
  
  // Template Html

  const htmlFormat = {
    transaction: {
      table: {
        body: (tableBody) => `
                <p class="kintoneplugin-desc">Set mapping fields</p>
                <table class="kintoneplugin-table">
                  <thead>
                    <tr>
                      <th class="kintoneplugin-table-th"><span class="title">Target</span></th>
                      <th class="kintoneplugin-table-th"><span class="title">Data Type</span></th>
                      <th class="kintoneplugin-table-th"><span class="title">Source</span></th>
                      <th class="kintoneplugin-table-th-blankspace"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableBody}
                  </tbody>
                </table>
              `,
        row:  (sourceOptions, targetOptions) => `
                <tr>
            
                  <td class="target-field">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-select-outer">
                          <div class="kintoneplugin-select target-field">
                            <select name="target-field">
                              <option value="null" selected hidden></option>
                              ${targetOptions}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td class="data-type">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-select-outer">
                          <div class="kintoneplugin-select data-type">
                            <select name="data-type">
                              <option value="select" selected>Select</option>
                              <option value="text">Text</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
            
                  <td class="source-field">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-select-outer">
                          <div class="kintoneplugin-select source-field">
                            <select name="source-field">
                              <option value="null" selected hidden></option>
                              ${sourceOptions}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
            
                  <td class="kintoneplugin-table-td-operation">
                    <button type="button" class="kintoneplugin-button-add-row-image" title="Add row"></button>
                    <button type="button" class="kintoneplugin-button-remove-row-image" title="Delete this row"></button>
                  </td>
                </tr>
              `
      },
      unique: (options) => `
                <span>Save Reference Record ID to :&nbsp;</span> 
                <div class="kintoneplugin-select-outer">
                  <div class="kintoneplugin-select unique-field">
                    <select name="unique-field">
                      <option value="null" selected hidden></option>
                      ${options}
                    </select>
                  </div>
                </div>
              `
    },
    condition: {
      table: {
        body: (tableBody) => `
                <p class="kintoneplugin-desc">Set Condition</p>
                <table class="kintoneplugin-table">
                  <thead>
                    <tr>
                      <th class="kintoneplugin-table-th"><span class="title">Field</span></th>
                      <th class="kintoneplugin-table-th"><span class="title">Operator</span></th>
                      <th class="kintoneplugin-table-th"><span class="title">Condition</span></th>
                      <th class="kintoneplugin-table-th-blankspace cond"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableBody}
                  </tbody>
                </table>
              `,
        row: (sourceOptions, targetOptions) => `
                <tr>
                  <td class="cond-field">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-select-outer">
                          <div class="kintoneplugin-select cond-field">
                            <select name="cond-field">
                              <option value="null" selected></option>
                              ${sourceOptions}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td class="operator">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-select-outer">
                          <div class="kintoneplugin-select operator">
                            <select name="operator">
                              <option value="=" selected>=</option>
                              <option value="<>"><></option>
                              <option value=">=">>=</option>
                              <option value="<="><=</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
            
                  <td class="cond-value">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-input-outer">
                          <input class="kintoneplugin-input-text" name="cond-value" type="text" />
                        </div>
                      </div>
                    </div>
                  </td>
            
                  <td class="kintoneplugin-table-td-operation">
                    <button type="button" class="kintoneplugin-button-add-row-image cond" title="Add row"></button>
                    <button type="button" class="kintoneplugin-button-remove-row-image cond" title="Delete this row"></button>
                  </td>
                </tr>
              `
      }
    },
    summary: {
      table: {
        body: (tableBody) => `
                <p class="kintoneplugin-desc">Set mapping fields</p>
                <table class="kintoneplugin-table">
                  <thead>
                    <tr>
                      <th class="kintoneplugin-table-th"><span class="title">Target</span></th>
                      <th class="kintoneplugin-table-th"><span class="title">Source</span></th>
                      <th class="kintoneplugin-table-th"><span class="title">Format</span></th>
                      <!-- <th class="kintoneplugin-table-th"><span class="title">Filter</span></th> -->
                      <th class="kintoneplugin-table-th-blankspace"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableBody}
                  </tbody>
                </table>
              `,
        row:  (sourceOptions, targetOptions, filterOptions) => `
                <tr>
            
                  <td class="target-field">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-select-outer">
                          <div class="kintoneplugin-select target-field">
                            <select name="target-field">
                              <option value="null" selected hidden></option>
                              ${targetOptions}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
            
                  <td class="source-field">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-select-outer">
                          <div class="kintoneplugin-select source-field">
                            <select name="source-field">
                              <option value="null" selected hidden></option>
                              ${sourceOptions}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                 <td class="format-field">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-input-outer">
                          <input class="kintoneplugin-input-text" name="format-field" type="text" disabled/>
                        </div>
                      </div>
                    </div>
                  </td> 

                  <!-- <td class="source-field">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-select-outer">
                          <div class="kintoneplugin-select filter-field">
                            <select name="filter-field">
                              <option value="null" selected hidden></option>
                              ${filterOptions}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td> -->


                  <td class="kintoneplugin-table-td-operation">
                    <button type="button" class="kintoneplugin-button-add-row-image" title="Add row"></button>
                    <button type="button" class="kintoneplugin-button-remove-row-image" title="Delete this row"></button>
                  </td>
                </tr>
              `
      },
      summarySet : {
        set: (isCore) => `
          <div class="set">
            <div class="kintoneplugin-row summary-field">
              ${htmlFormat.summary.summaryField(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos))}
            </div>

            <div class="kintoneplugin-row plus-table">
            </div>

            <div class="kintoneplugin-row minus-table">
            </div>

            <div class="kintoneplugin-table-td-operation">
              <button type="button" class="kintoneplugin-button-add-row-image add-row" title="Add row"></button>
              ${
                (!isCore) ? `<button type="button" class="kintoneplugin-button-remove-row-image remove-row" title="Add row"></button>` : ""
              }
            </div>
          </div>
        `
      },
      periodTable: {
        body: (tableBody) => `
                <p class="kintoneplugin-desc">Set period conditions</p>
                <table class="kintoneplugin-table">
                  <thead>
                    <tr>
                      <th class="kintoneplugin-table-th"><span class="title">Field</span></th>
                      <th class="kintoneplugin-table-th"><span class="title">Period</span></th>
                      <th class="kintoneplugin-table-th-blankspace"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableBody}
                  </tbody>
                </table>
              `,
        row:  (sourceOptions) => `
                <tr>
            
                  <td class="source-field">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-select-outer">
                          <div class="kintoneplugin-select source-field">
                            <select name="source-field">
                              <option value="null" selected hidden></option>
                              ${sourceOptions}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
            
                  <td class="period-field">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-select-outer">
                          <div class="kintoneplugin-select period-field">
                            <select name="period-field">
                              <option value="null" selected hidden></option>
                              <option value="THIS_MONTH()" >This Month</option>
                              <option value="THIS_YEAR()" >This Year</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
            
                  <td class="kintoneplugin-table-td-operation">
                    <button type="button" class="kintoneplugin-button-add-row-image" title="Add row"></button>
                    <button type="button" class="kintoneplugin-button-remove-row-image" title="Delete this row"></button>
                  </td>
                </tr>
              `
      },
      plusTable: {
        body: (tableBody) => `
                <p class="kintoneplugin-desc">Set plus conditions</p>
                <table class="kintoneplugin-table">
                  <thead>
                    <tr>
                      <th class="kintoneplugin-table-th"><span class="title">Field</span></th>
                      <th class="kintoneplugin-table-th"><span class="title">Value</span></th>
                      <th class="kintoneplugin-table-th-blankspace"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableBody}
                  </tbody>
                </table>
              `,
        row:  (sourceOptions) => `
                <tr>
            
                  <td class="target-field">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-select-outer">
                          <div class="kintoneplugin-select source-field">
                            <select name="target-field">
                              <option value="null" selected hidden></option>
                              ${sourceOptions}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
            
                  <td class="cond-value">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-input-outer">
                          <input class="kintoneplugin-input-text" name="cond-value" type="text" />
                        </div>
                      </div>
                    </div>
                  </td>
            
                  <td class="kintoneplugin-table-td-operation">
                    <button type="button" class="kintoneplugin-button-add-row-image" title="Add row"></button>
                    <button type="button" class="kintoneplugin-button-remove-row-image" title="Delete this row"></button>
                  </td>
                </tr>
              `
      },
      minusTable: {
        body: (tableBody) => `
                <p class="kintoneplugin-desc">Set minus conditions</p>
                <table class="kintoneplugin-table">
                  <thead>
                    <tr>
                      <th class="kintoneplugin-table-th"><span class="title">Field</span></th>
                      <th class="kintoneplugin-table-th"><span class="title">Value</span></th>
                      <th class="kintoneplugin-table-th-blankspace"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableBody}
                  </tbody>
                </table>

                <!-- <div class="kintoneplugin-table-td-operation">
                  <button type="button" class="kintoneplugin-button-add-row-image" title="Add row"></button>
                </div> -->
              `,
        row:  (sourceOptions) => `
                <tr>
            
                  <td class="target-field">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-select-outer">
                          <div class="kintoneplugin-select source-field">
                            <select name="target-field">
                              <option value="null" selected hidden></option>
                              ${sourceOptions}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
            
                  <td class="cond-value">
                    <div class="kintoneplugin-table-td-control">
                      <div class="kintoneplugin-table-td-control-value">
                        <div class="kintoneplugin-input-outer">
                          <input class="kintoneplugin-input-text" name="cond-value" type="text" />
                        </div>
                      </div>
                    </div>
                  </td>
            
                  <td class="kintoneplugin-table-td-operation">
                    <button type="button" class="kintoneplugin-button-add-row-image" title="Add row"></button>
                    <button type="button" class="kintoneplugin-button-remove-row-image" title="Delete this row"></button>
                  </td>
                </tr>
              `
      },
      summaryField: (sourceOptions, targetOptions) => `
                      <p class="kintoneplugin-desc">Select summary fields</p>
                      <div class="kintoneplugin-select-outer">
                        <div class="kintoneplugin-select">
                          <select name="sum-source-field">
                            <option value="null" selected hidden></option>
                            ${sourceOptions}
                          </select>
                        </div>
                      </div>
                      =>
                      <div class="kintoneplugin-select-outer">
                      <div class="kintoneplugin-select">
                        <select name="sum-target-field">
                          <option value="null" selected hidden></option>
                          ${targetOptions}
                        </select>
                      </div>
                    </div>
                    `
    },
    optionGroup: (groupName, options) => `
                    <optgroup label="${groupName}">
                      ${options}
                    </optgroup>
                  `
  }

  var functions = {

  }

  var htmlTargetOption = "";
  var htmlUniqueOption = "";
  
  var htmlSourceOption = "";

  var $form = $('.js-submit-settings');
  var $cancelButton = $('.js-cancel-button');
  
  var fieldinfos = [];
  var targetID = "";
  
  var vars = {
    apps: {},
    source: {},
    target: {},
    setting: {
      reloaded: false
    },
    summary: {
      tran: {
        appID: 'null',
        fields: {}
      },
      sum: {
        appID: 'null',
        fields: {}
      }
    }
  }

  function loadApps(){
    return new Promise((resolve) => {
      let apps = {}
      fetchAllApps().then(function(records){
        for (const app of records){
          if(app.appId != AppID)
            apps[app.appId] = app
        }
        resolve(apps);
      });
    })
  }

  function loadFields(ID){
    let fields = {
      fieldinfos: {},
      hasUnique: false
    }
    return new Promise ((resolve) => {
      kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', {
        'app': ID,
        'query': 'order by '
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

  function fetchAll(app, query, fields, opt_offset, opt_records) {
    var offset = opt_offset || 0;
    var records = opt_records || [];
    var params = {
      app: app,
      query: `${query} limit 100 offset ${offset}`,
      fields: fields
    };
    return kintone.api('/k/v1/records', 'GET', params).then(function(resp) {
      records = records.concat(resp.records);
      if (resp.records.length === 100) {
        return fetchAll(app, query, fields, offset + 100, records);
      }
      return records;
    });
  }

  function fetchAllApps(opt_offset, opt_records) {
    var offset = opt_offset || 0;
    var apps = opt_records || [];
    return kintone.api('/k/v1/apps', 'GET', {'offset': offset}).then(function(resp) {
      apps = apps.concat(resp.apps);
      if (resp.apps.length === 100) {
        return fetchAllApps(offset + 100, apps);
      }
      return apps;
    });
  }

  function getAppOptions(apps){
    let htmlOptions = ""

    let sorted = []

    for(let key in apps){
      sorted.push(key)
    }
    
    for(let i=0; i<sorted.length; i++){
      for(let j=0; j<sorted.length; j++){
        if(apps[sorted[j]].name >= apps[sorted[i]].name){
          let temp = sorted[i]
          sorted[i] = sorted[j]
          sorted[j] = temp
        }
      }
    }
    
    for(const key of sorted){

    // for (const [key, value] of Object.entries(apps)) {
      let value = apps[key]
      htmlOptions += `<option value="${value.appId}">${value.name}</option>`
    }
    return htmlOptions;
  }

  function getField(fields){
    let htmlOptions = ""
    let optionGroup = [];

    let sorted = []

    for(let key in fields){
      sorted.push(key)
    }
    
    for(let i=0; i<sorted.length; i++){
      for(let j=0; j<sorted.length; j++){
        if(fields[sorted[j]].label >= fields[sorted[i]].label){
          let temp = sorted[i]
          sorted[i] = sorted[j]
          sorted[j] = temp
        }
      }
    }
    
    for(const key of sorted){
    // for (const [key, field] of Object.entries(fields)){
      switch(fields[key].type){
        case 'CATEGORY':
        case 'CREATED_TIME':
        case 'CREATOR':
        case 'FILE':
        case 'MODIFIER':
        case 'REFERENCE_TABLE':
        case 'STATUS':
        case 'STATUS_ASSIGNEE':
        case 'UPDATED_TIME':
        case 'RECORD_NUMBER':
          break;
        case 'SUBTABLE':
          // console.log(fields[key]);
          optionGroup.push({
            'label': fields[key].label,
            'value': fields[key].code,
            'options': ((foo, group) => {
              let str = "";

              let nestedSorted = []

              for(let key in foo){
                nestedSorted.push(key)
              }
              
              for(let i=0; i<nestedSorted.length; i++){
                for(let j=0; j<nestedSorted.length; j++){
                  if(foo[nestedSorted[j]].label >= foo[nestedSorted[i]].label){
                    let temp = nestedSorted[i]
                    nestedSorted[i] = nestedSorted[j]
                    nestedSorted[j] = temp
                  }
                }
              }

              for(const key of nestedSorted){
                let value = foo[key]
                str += `<option value="${value.code}" group="${group}">${value.label}</option>`;
              }
              return str;
            })(fields[key].fields, fields[key].code)
          });

        default :
        htmlOptions += `<option value="${fields[key].code}">${fields[key].label}</option>`;
      }
    }

    optionGroup.forEach(element => {
      htmlOptions += htmlFormat.optionGroup(element.label, element.options)
    });

    return htmlOptions;
  }

  function getUniqueField(fields){
    let htmlOptions = ""
    for (const [key, field] of Object.entries(fields)){
      switch(field.type){
        case 'CATEGORY':
        case 'CREATED_TIME':
        case 'CREATOR':
        case 'FILE':
        case 'MODIFIER':
        case 'REFERENCE_TABLE':
        case 'STATUS':
        case 'STATUS_ASSIGNEE':
        case 'UPDATED_TIME':
        case 'RECORD_NUMBER':
          break;
        default :
          if('unique' in field){
            if(field.unique){
              htmlOptions += `<option value="${field.code}">${field.label}</option>`;
            } 
          }
      }
    }
    return htmlOptions;
  }

  function getCondField(fields){
    let htmlOptions = ""
    // console.log(fields)
    for (const [key, field] of Object.entries(fields)){
      switch(field.type){
        case 'CATEGORY':
        case 'CREATOR':
        case 'FILE':
        case 'MODIFIER':
        case 'REFERENCE_TABLE':
        case 'STATUS_ASSIGNEE':
        case 'RECORD_NUMBER':
        case 'SUBTABLE':
        case 'CALC':
        case 'GROUP':
        case 'CREATED_TIME':
        case 'UPDATED_TIME':
        case 'DATE':
          break;
        case 'STATUS':
        default :
          htmlOptions += `<option value="${field.code}">${field.label}</option>`;
      }
    }
    return htmlOptions;
  }

  function reloadField(fields, source, target){
    if(fields.length > 0){
      $('#transaction .mapping-table').append(htmlFormat.transaction.table.body(""));
      fields.forEach(row => {
        $('#transaction .mapping-table tbody').append(htmlFormat.transaction.table.row(getField(source.fieldinfos), getField(target.fieldinfos)))
        $('#transaction .mapping-table tr:last').find('[name="target-field"]').val(row.target.value).change();
        if(row.source.type == 'subtable'){
          $('#transaction .mapping-table tr:last').find('[name="data-type"]').val(row.source.value.type).change();
          $('#transaction .mapping-table tr:last').find('[name="source-field"]').val(row.source.value.value).change();
        }else{
          $('#transaction .mapping-table tr:last').find('[name="data-type"]').val(row.source.type).change();
          $('#transaction .mapping-table tr:last').find('[name="source-field"]').val(row.source.value).change();
        }
      });
    }else{
      $('#transaction .mapping-table').append(htmlFormat.transaction.table.body(htmlFormat.transaction.table.row(getField(vars.source.fieldinfos), getField(vars.target.fieldinfos))));
      $('.kintoneplugin-button-remove-row-image').addClass('hidden');
    }      
  }

  function reloadCondition(conditions){
    if(conditions.length > 0){
      $('.cond-table').append(htmlFormat.condition.table.body(""));
      conditions.forEach(row => {
        // console.log(row);
        $('.cond-table tbody').append(htmlFormat.condition.table.row(getCondField(vars.source.fieldinfos)))
        $('.cond-table tr:last').find('[name="cond-field"]').val(row.field).change();
        $('.cond-table tr:last').find('[name="operator"]').val(row.operator).change();
        $('.cond-table tr:last').find('[name="cond-value"]').val(row.value).change();
      });
    }else{
      $('.checkbox-cond').removeClass('hidden');
    }      
  }

  function reloadSummary(summary){
    if(summary.mapping.length > 0){
      $('#summary .mapping-table').append(htmlFormat.summary.table.body(""));
      summary.mapping.forEach(row => {
        $('#summary .mapping-table tbody').append(htmlFormat.summary.table.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos), getField(vars.source.fieldinfos)))
        
        // console.log($('#summary .mapping-table tr:last').find('[name="target-field"]'))
        $('#summary .mapping-table tr:last').find('[name="target-field"]').val(row.target).change();
        $('#summary .mapping-table tr:last').find('[name="source-field"]').val(row.source).change();
        
        // $('#summary .mapping-table tr:last').find('[name="filter-field"]').val(row.filter).change();
        
        // console.log(vars.summary.sum.fields.fieldinfos[row.source])

        if(vars.summary.tran.fields.fieldinfos[row.source]['type'] == "DATE"){
          $('#summary .mapping-table tr:last').find('[name="format-field"]').val(row.format).change();
        }else{
          $('#summary .mapping-table tr:last').find('[name="format-field"]').attr('disabled', 'disabled')
        }

      });
    }else{
      $('#summary .mapping-table').append(htmlFormat.summary.table.body(htmlFormat.summary.table.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos), getField(vars.source.fieldinfos))));
      $('.checkbox-cond').removeClass('hidden');
    }      
  }
  
  function reloadPeriod(period){
    // console.log(period)
    if(period.length > 0){
      $('#summary .period-table').append(htmlFormat.summary.periodTable.body(""));
      period.forEach(row => {
        $('#summary .period-table tbody').append(htmlFormat.summary.periodTable.row(getField(vars.summary.tran.fields.fieldinfos)))
        
        $('#summary .period-table tr:last').find('[name="source-field"]').val(row.source).change();
        $('#summary .period-table tr:last').find('[name="period-field"]').val(row.period).change();
      });

      if(period.length == 1){
        $('#summary .period-table tr:last').find('.kintoneplugin-button-remove-row-image').hide()
      }
    }else{
      $('#summary .period-table').append(htmlFormat.summary.periodTable.body(htmlFormat.summary.periodTable.row(
        getField(vars.summary.tran.fields.fieldinfos))));
      $('.checkbox-cond').removeClass('hidden');
    }      
  }

  function reloadCal(summary, plus, minus, index){
    if(index == 0)
      $('.summary-list').append(htmlFormat.summary.summarySet.set(true))
    else
      $('.summary-list').append(htmlFormat.summary.summarySet.set(false))

    let container = $('.summary-list .set:last-child')
    
    // $(container.find('.summary-field')).append(htmlFormat.summary.summaryField(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos)))
    
    $(container.find('.summary-field').find('select')[0]).val(summary.source)
    $(container.find('.summary-field').find('select')[1]).val(summary.target)
    
    reloadSummaryPlus(container, plus)
    reloadSummaryMinus(container, minus)

  }

  function reloadSummaryPlus(container, fields){
    if(fields.length > 0){
      container.find(`.plus-table`).append(htmlFormat.summary.plusTable.body(""));
      fields.forEach((row, index) => {
        container.find(`.plus-table tbody`).append(htmlFormat.summary.plusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos)))
        
        container.find(`.plus-table tr:last`).find('[name="target-field"]').val(row.target);
        container.find(`.plus-table tr:last`).find('[name="cond-value"]').val(row.cond);
      });

      if(fields.length == 1){
        container.find('.plus-table tr:last').find('.kintoneplugin-button-remove-row-image').hide()
      }
    }else{
      container.find('.plus-table').append(htmlFormat.summary.plusTable.body(htmlFormat.summary.plusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos))))
      container.find('.checkbox-cond').removeClass('hidden');
    }      
  }

  function reloadSummaryMinus(container, fields){
    if(fields.length > 0){
      container.find(`.minus-table`).append(htmlFormat.summary.minusTable.body(""));
      fields.forEach((row, index) => {
        container.find(`.minus-table tbody`).append(htmlFormat.summary.minusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos)))
        
        container.find(`.minus-table tr:last`).find('[name="target-field"]').val(row.target);
        container.find(`.minus-table tr:last`).find('[name="cond-value"]').val(row.cond);
      });

      if(fields.length == 1){
        container.find('.minus-table tr:last').find('.kintoneplugin-button-remove-row-image').hide()
      }
    }else{
      container.find('.minus-table').append(htmlFormat.summary.minusTable.body(htmlFormat.summary.minusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos))))
      container.find('.checkbox-cond').removeClass('hidden');
    }      
  }

  $(document).ready(async function(){
    /*---------------------------------------------------------------
    initialize fields
    ---------------------------------------------------------------*/
    vars['apps'] = await loadApps()
    vars['source'] = await loadFields(AppID);

    $('#transaction select[name="target-app"]').append(getAppOptions(vars.apps));
    
    $('#summary select[name="transaction-app"]').append(getAppOptions(vars.apps));
    $('#summary select[name="summary-app"]').append(getAppOptions(vars.apps));
    
    if('summary' in CONF){
      if(CONF.summary.app.source && CONF.summary.app.target){
        $('#summary select[name="transaction-app').val(CONF.summary.app.source).change();
        $('#summary select[name="summary-app').val(CONF.summary.app.target).change();
      }
    }

    if(CONF.targetID){
      $('#transaction select[name="target-app"]').val(CONF.targetID).change();
    }

  });

  /*---------------------------------------------------------------
    Event function
    ---------------------------------------------------------------*/
  
  /**
   * ถ้า target app ถูกเปลี่ยน จะสร้าง unique field
   */
  $('select[name="target-app"]').on('change', async function(){
    vars['target'] = await loadFields($(this).val());
    targetID = $('select[name="target-app"]').find(':selected').val();

    if(vars.target.hasUnique){
      $('.unique-message').html("");
      $('.cond-table').empty();
      $('#transaction .mapping-table').empty();
      
      $('.unique-field').html(htmlFormat.transaction.unique(getUniqueField(vars.target.fieldinfos)));

      // เช็คถ้ามี unique field
      if(CONF.uniqueField){
        $('select[name="unique-field"]').val(CONF.uniqueField).change();  
      }
    }else{
      $('.unique-message').html('* The target app must have unique fields.');
      $('#transaction .mapping-table').empty();
      $('.cond-table').empty();
      $('.unique-field').empty();
    }
  });

  /**
   * ถ้า unique field ถูกเปลี่ยน
   */
  $('.sec-form#transaction').on('change', 'select[name="unique-field"]', function(e){  
    let config = kintone.plugin.app.getConfig(PLUGIN_ID);

    // รีเซ็ตตาราง
    $('#transaction .mapping-table').empty();
    $('.cond-table').empty();

    // ถ้าเข้าครั้งแรก
    if(!vars.setting.reloaded){

      // ถ้ามี unique field
      if(CONF.uniqueField){ 
        if(CONF.uniqueField == $('select[name="unique-field"]').val()){

          // รีโหลดตาราง conditions
          if('conditions' in CONF){
            reloadCondition(JSON.parse(CONF.conditions));
          }else{
            $('.checkbox-cond').removeClass('hidden');
          }

          // รีโหลด mapping table
          if('fieldinfos' in CONF){
            reloadField(JSON.parse(CONF.fieldinfos), vars.source, vars.target);
          }
        }
      }else{
        $('.checkbox-cond').removeClass('hidden');

        $('#transaction .mapping-table').append(htmlFormat.transaction.table.body(htmlFormat.transaction.table.row(getField(vars.source.fieldinfos), getField(vars.target.fieldinfos))));
        $('#transaction .mapping-table .kintoneplugin-button-remove-row-image').addClass('hidden');
      }
      vars['setting']['reloaded'] = true;
    }else{
      $('.checkbox-cond').removeClass('hidden');

      $('#transaction .mapping-table').append(htmlFormat.transaction.table.body(htmlFormat.transaction.table.row(getField(vars.source.fieldinfos), getField(vars.target.fieldinfos))));
      $('#transaction .mapping-table .kintoneplugin-button-remove-row-image').addClass('hidden');
    }
  });

  // Add
  $('#transaction .mapping-table').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('tr').after(htmlFormat.transaction.table.row(getField(vars.source.fieldinfos), getField(vars.target.fieldinfos)));
    $('#transaction .mapping-table .kintoneplugin-button-remove-row-image').removeClass('hidden');
  })
  
  // Remove
  $('#transaction .mapping-table').on('click', '.kintoneplugin-button-remove-row-image', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $('#transaction .mapping-table .kintoneplugin-button-remove-row-image').addClass('hidden');
    }
    $(this).closest('tr').remove();
  })


  // Add
  $('.checkbox-cond').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('.checkbox-cond').addClass('hidden');
    $('.cond-table').append(htmlFormat.condition.table.body(htmlFormat.condition.table.row(getCondField(vars.source.fieldinfos))));
  })

  // Remove
  $('.cond-table').on('click', '.kintoneplugin-button-add-row-image.cond', function(){
    $(this).closest('tr').after(htmlFormat.condition.table.row(getCondField(vars.source.fieldinfos)));
  })
  
  // Add
  $('#summary .mapping-table').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('tr').after(htmlFormat.summary.table.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos), getField(vars.source.fieldinfos)));
    $($(this).closest('tbody').find('tr')).each(function(){
      ($(this).find('.kintoneplugin-button-remove-row-image')).show()
    })
  })
  
  // Remove
  $('#summary .mapping-table').on('click', '.kintoneplugin-button-remove-row-image', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $($(this).closest('tbody').find('tr').find('.kintoneplugin-button-remove-row-image')).hide()
    }
    $(this).closest('tr').remove();
  })

   // Add
   $('#summary .period-table').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('tr').after(htmlFormat.summary.periodTable.row(getField(vars.summary.tran.fields.fieldinfos)));
    $($(this).closest('tbody').find('tr')).each(function(){ 
      ($(this).find('.kintoneplugin-button-remove-row-image')).show()
    })
  })
  
  // Remove
  $('#summary .period-table').on('click', '.kintoneplugin-button-remove-row-image', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $($(this).closest('tbody').find('tr').find('.kintoneplugin-button-remove-row-image')).hide()
    }
    $(this).closest('tr').remove();
  })

  // Add
  $('#summary .summary-list').on('click', '.plus-table .kintoneplugin-button-add-row-image', function(){
    console.log("click")  
    $(this).closest('tr').after(htmlFormat.summary.plusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos)));
    $($(this).closest('tbody').find('tr')).each(function(){ 
      ($(this).find('.kintoneplugin-button-remove-row-image')).show()
    })
  })
  
  // Remove
  $('#summary .summary-list').on('click', '.plus-table .kintoneplugin-button-remove-row-image', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $($(this).closest('tbody').find('tr').find('.kintoneplugin-button-remove-row-image')).hide()
    }
    $(this).closest('tr').remove();
  })

  // Add
  $('#summary .summary-list').on('click', '.minus-table .kintoneplugin-button-add-row-image', function(){
    $(this).closest('tr').after(htmlFormat.summary.minusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos)));
    $($(this).closest('tbody').find('tr')).each(function(){ 
      ($(this).find('.kintoneplugin-button-remove-row-image')).show()
    })
  })
  
  // Remove
  $('#summary .summary-list').on('click', '.minus-table .kintoneplugin-button-remove-row-image', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $($(this).closest('tbody').find('tr').find('.kintoneplugin-button-remove-row-image')).hide()
    }
    $(this).closest('tr').remove();
  })

  // Add
  $('#summary .summary-list').on('click', '.kintoneplugin-button-add-row-image.add-row', function(){
    
    $(this).closest('.set').after(
      htmlFormat.summary.summarySet.set()
    );
      
      // htmlFormat.summary.minusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos))
    $($(this).closest('tbody').find('tr')).each(function(){ 
      ($(this).find('.kintoneplugin-button-remove-row-image')).show()
    })
  })
  
  // Remove
  $('#summary .summary-list').on('click', '.kintoneplugin-button-remove-row-image.remove-row', function(){
    var rowCount = $(this).closest('.summary-list').find('.set').length;
    if(rowCount == 2){
      $($(this).closest('.summary-list').find('.set').find('.kintoneplugin-button-remove-row-image.remove-row')).hide()
    }
    $(this).closest('.set').remove();
  })

  // Remove all
  $('.cond-table').on('click', '.kintoneplugin-button-remove-row-image.cond', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 1){
      $('.cond-table').empty();
      $('.checkbox-cond').removeClass('hidden')
    }else{
      $(this).closest('tr').remove();
    }
  })

  // Mapping table Data type
  $('#transaction .mapping-table').on('change', 'select[name="data-type"]', function(){
    let type = $('option:selected', this).attr('value');
    if(type == 'select'){
      $($(this).closest('tr').find('.source-field .kintoneplugin-table-td-control-value')[0]).html(`
        <div class="kintoneplugin-select-outer">
          <div class="kintoneplugin-select source-field">
            <select name="source-field">
              <option value="null" selected hidden></option>
              ${getField(vars.source.fieldinfos)}
            </select>
          </div>
        </div>
      `);
    }else if(type == 'text'){
      $($(this).closest('tr').find('.source-field .kintoneplugin-table-td-control-value')[0]).html(`
        <div class="kintoneplugin-input-outer">
          <input class="kintoneplugin-input-text" name="source-field" type="text" />
        </div>
      `);
    }
  });


  // Condition data type
  $('.cond-table').on('change', 'select[name="cond-field"]', function(){
    let field = $('option:selected', this).attr('value');
    let type = vars.source.fieldinfos[field].type

    switch (type) {
      case 'DATE':
      case 'UPDATED_TIME':
      case 'CREATED_TIME':
        $($(this).closest('tr').find('.cond-value .kintoneplugin-table-td-control-value')[0]).html(`
          <div class="kintoneplugin-input-outer">
            <input class="kintoneplugin-input-text" name="cond-value" type="date" />
          </div>
        `);
        break;
      default:
        $($(this).closest('tr').find('.cond-value .kintoneplugin-table-td-control-value')[0]).html(`
          <div class="kintoneplugin-input-outer">
            <input class="kintoneplugin-input-text" name="cond-value" type="text" />
          </div>
        `);
    }
  });


  // ถ้า transaction app and summary app ไม่ว่าง
  $('#summary select[name="transaction-app"], #summary select[name="summary-app"]').on('change', async function(){
    vars['summary']['tran']['appID'] = $('#summary select[name="transaction-app"]').find(':selected').val();
    
    if(vars['summary']['tran']['appID'] != 'null'){
      vars['summary']['tran']['fields'] = await loadFields(vars['summary']['tran']['appID']);
    }

    vars['summary']['sum']['appID'] = $('#summary select[name="summary-app"]').find(':selected').val();
    if(vars['summary']['sum']['appID'] != 'null'){
      vars['summary']['sum']['fields'] = await loadFields(vars['summary']['sum']['appID']);
    }

    $('#summary .mapping-table').empty()
    $('#summary .period-table').empty()
    $('#summary .summary-list').empty()

    $('#summary .summary-field').empty()

    // เพิ่ม summary field และ period
    if(vars['summary']['tran']['appID'] != 'null' && vars['summary']['sum']['appID'] != 'null'){
      if('summary' in CONF){
        reloadSummary(CONF.summary)
        reloadPeriod(CONF.summary.period)

        if('summaryList' in CONF.summary){
          for(let [index, item] of CONF.summary.summaryList.entries()){
            reloadCal(item.summary, item.plus, item.minus, index)
          }
        }else{
          $('.summary-list').append(htmlFormat.summary.summarySet.set(true))
        }
      }else{
        reloadSummary({
          'mapping': []
        })
        
        reloadPeriod([])
        
        $('.summary-list').append(htmlFormat.summary.summarySet.set(true))
      }

    }
  });

  // เมื่อ summary ถูกเลือกทั้งสอง
  $('#summary').on('change', '.summary-field select[name="sum-source-field"], .summary-field select[name="sum-target-field"]', function(){
    
    $(this).closest('.set').find('.plus-table').empty()
    $(this).closest('.set').find('.minus-table').empty()

    if($(this).closest('.set').find('select[name="sum-source-field"]').find(':selected').val() != 'null' && $(this).closest('.set').find('select[name="sum-target-field"]').find(':selected').val() != 'null'){
      console.log("click")
      
      $(this).closest('.set').find('.plus-table').html(
        htmlFormat.summary.plusTable.body(
          htmlFormat.summary.plusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos))
        )
      )
      
      $(this).closest('.set').find('.minus-table').html(
        htmlFormat.summary.minusTable.body(
          htmlFormat.summary.minusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos))
        )
      )
    }
  });

  // 
  $('#summary .mapping-table').on('change', 'select[name="source-field"]', function(){
    let val = $(this).val()
    // console.log(vars.summary.tran.fields.fieldinfos[val]['type'])
    if(vars.summary.tran.fields.fieldinfos[val]['type'] != "DATE"){
      $($(this).closest('tr')).find('[name="format-field"]').attr('disabled', 'disabled')
      // $('#summary .mapping-table tr:last').find('[name="format-field"]').attr('disabled', 'disabled')
    }else{
      $($(this).closest('tr')).find('[name="format-field"]').removeAttr('disabled')
      // $('#summary .mapping-table tr:last').find('[name="format-field"]').removeAttr('disabled')
    }
  });

  /**
   * Submit function
   */
  $('.kintoneplugin-button-dialog-ok').on('click', function(e) {
    let hasSubtable = false;

    e.preventDefault();

    fieldinfos = [];
    var conditions = [];
    let check = true;

    var summary = {
      'app': {},
      'mapping': [],
      'summary': {},
      'plus': [],
      'minus': [],
    }

    $('.cond-table tbody tr').each(function(){

      let element = {
        'field' : $(this).find('[name="cond-field"]'),
        'operator' : $(this).find('[name="operator"]'),
        'value' :  $(this).find('[name="cond-value"]'),
      }

      if( element['field'].val() == 'null' || element['operator'].val() == 'null' || element['value'].val() == ''){
        alert('Cond can\'t set field be null');
        check = false;
        return;
      }

      conditions.push({
        'field': element['field'].val(), 
        'operator': element['operator'].val(), 
        'value': element['value'].val()});
    })

    $('#transaction .mapping-table tbody tr').each(function(){
      // console.log($(this).find('[name="source-field"]').val());
      // console.log($(this).find('[name="target-field"]').val());
      // console.log($(this).find('[name="data-type"]').val());
      let element = {
        'target' : {
          'select': $(this).find('[name="target-field"]')
        },
        'source' : {
          'select': $(this).find('[name="source-field"]'),
          'selected': $($(this).find('[name="source-field"]')[0]).find(':selected')
        },
        'dataType' : {
          'select': $(this).find('[name="data-type"]')
        },
      }

      if( element['source']['select'].val() == 'null' || element['target']['select'].val() == 'null' || element['target']['select'].val() == ''){
        alert('Can\'t set field be null');
        return;
      }

      fieldinfos.push({'source': {},'target': {}});

      // set target value
      fieldinfos[fieldinfos.length-1]['target'] = {
        'type': "",
        'value': element['target']['select'].val()
      }
      
      // set source value
      if( element['dataType']['select'].val() == 'select'){
        if(typeof element['source']['selected'].attr('group') !== 'undefined' && element['source']['selected'].attr('group') !== false){
          hasSubtable = true;
          fieldinfos[fieldinfos.length-1]['source'] = {
            'type': 'subtable',
            'value': {
              'type': 'select',
              'group': element['source']['selected'].attr('group'),
              'value': element['source']['select'].val()
            }
          }
        }else{
          fieldinfos[fieldinfos.length-1]['source'] = {
            'type': 'select',
            'value': element['source']['select'].val()
          }
        }
      }else if( element['dataType']['select'].val() == 'text'){
        fieldinfos[fieldinfos.length-1]['source'] = {
          'type': element['dataType']['select'].val(),
          'value': element['source']['select'].val()
        }
      }
    })


    // Summary
    summary['app']['source'] = $('select[name="transaction-app"]').find(':selected').val();
    summary['app']['target'] = $('select[name="summary-app"]').find(':selected').val();

    summary['mapping'] = []
    $('#summary .mapping-table tbody tr').each(function(){

      let element = {
        'target' : $(this).find('[name="target-field"]'),
        'source' : $(this).find('[name="source-field"]'),
        'format' : $(this).find('[name="format-field"]'),
        'type': vars.summary.tran.fields.fieldinfos[$(this).find('[name="source-field"]').val()]['type']
      }

      if( element['target'].val() == 'null' || element['source'].val() == 'null'){
        alert('Cond can\'t set field be null');
        check = false;
        return;
      }

      summary.mapping.push({
        'target': element['target'].val(), 
        'source': element['source'].val(), 
        'format': element['format'].val(), 
        'type': element['type'], 
      });

    })

    summary['period'] = []
    $('#summary .period-table tbody tr').each(function(){

      let element = {
        'source' : $(this).find('[name="source-field"]'),
        'period' : $(this).find('[name="period-field"]'),
      }

      if( element['source'].val() == 'null' || element['period'].val() == 'null'){
        alert('Cond can\'t set field be null');
        check = false;
        return;
      }

      summary.period.push({
        'source': element['source'].val(), 
        'period': element['period'].val(), 
      });

    })

    summary['summaryList'] = []

    $('#summary .summary-list .set').each(function(index){
      var tempJson = {}
      
      console.log($(this).find('select[name="sum-source-field"]').find(':selected').val())
      tempJson = {
        'summary' : {
          'source' : $(this).find('select[name="sum-source-field"]').find(':selected').val(),
          'target' : $(this).find('select[name="sum-target-field"]').find(':selected').val()
        }
      }

      // Plus
      tempJson['plus'] = []
      $(this).find('.plus-table tbody tr').each(function(){
        
        // let element = {
        //   'target' : $(this).find('[name="target-field"]'),
        //   'cond' : $(this).find('[name="cond-value"]'),
        // }
        let element = {
          'target' : $(this).find('select[name="target-field"]').find(':selected').val(),
          'cond' : $(this).find('input[name="cond-value"]').val(),
        }
  
        if(index == 0 && element['target'] == 'null' || element['cond'] == 'null'){
          alert('Cond can\'t set field be null');
          check = false;
          return;
        }
  
        if(element['target'] != 'null'){
          tempJson.plus.push({
            'target': element['target'], 
            'cond': element['cond'], 
          });
        }
  
      })
  
      // Minus
      tempJson['minus'] = []
      $(this).find('.minus-table tbody tr').each(function(){
        
        let element = {
          'target' : $(this).find('select[name="target-field"]').find(':selected').val(),
          'cond' : $(this).find('input[name="cond-value"]').val(),
        }

        // let element = {
        //   'target' : $(this).find('[name="target-field"]'),
        //   'cond' : $(this).find('[name="cond-value"]'),
        // }
  
        if(index == 0 && element['target'] == 'null' || element['cond'] == 'null'){
          alert('Cond can\'t set field be null');
          check = false;
          return;
        }
  
        if(element['target'] != 'null'){
          tempJson.minus.push({
            'target': element['target'], 
            'cond': element['cond'], 
          });
        }
  
      })

      summary['summaryList'].push(tempJson)
    })
  
    
    console.log(summary);

    let subtableGroup = "";
    fieldinfos.forEach(element => {
      if(element.source.type == 'subtable'){
        if(subtableGroup == ""){
          subtableGroup = element.source.value.group;
        }else{
          if(subtableGroup != element.source.value.group){
            alert('Error! Only one subtable can be used.');
            check = false;
            return;
          }
        }
      }
    });

    if(check){
      kintone.plugin.app.setConfig({
        'targetID': targetID,
        'uniqueField': $('select[name="unique-field"]').val(),
        'hasSubtable': hasSubtable.toString(),
        'fieldinfos': JSON.stringify(fieldinfos, ''),
        'conditions': JSON.stringify(conditions, ''),
        'summary': JSON.stringify(summary, '')
      }, function() {
        alert('The plug-in settings have been saved. Please update the app!');
        window.location.href = '../../flow?app=' + kintone.app.getId();
      });
    }
  });
  
  $cancelButton.on('click', function() {
    window.location.href = '../../' + kintone.app.getId() + '/plugin/';
  });
})(jQuery, kintone.$PLUGIN_ID);
