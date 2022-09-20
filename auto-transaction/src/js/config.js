jQuery.noConflict();

(function($, PLUGIN_ID) {
  'use strict';

  // const
  const AppID = kintone.app.getId();

  const ignoreField = ['id', 'status', 'app_id', 'ref_record_no'];

  const CONF = kintone.plugin.app.getConfig(PLUGIN_ID);
  CONF['summary'] = JSON.parse(kintone.plugin.app.getConfig(PLUGIN_ID)['summary']);
  
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

                  <td class="kintoneplugin-table-td-operation">
                    <button type="button" class="kintoneplugin-button-add-row-image" title="Add row"></button>
                    <button type="button" class="kintoneplugin-button-remove-row-image" title="Delete this row"></button>
                  </td>
                </tr>
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
      kintone.api(kintone.api.url('/k/v1/apps', true), 'GET', {offset:20})
      .then(async function(resp){
        for (const app of resp.apps){
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

  function getAppOptions(apps){
    let htmlOptions = ""
    for (const [key, value] of Object.entries(apps)) {
      htmlOptions += `<option value="${value.appId}">${value.name}</option>`
    }
    return htmlOptions;
  }

  function getField(fields){
    let htmlOptions = ""
    let optionGroup = [];
    // console.log(fields);
    // Load source fields 
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
        case 'SUBTABLE':
          // console.log(field);
          optionGroup.push({
            'label': field.label,
            'value': field.code,
            'options': ((foo, group) => {
              let str = "";
              for (const [key, value] of Object.entries(foo)) {
                str += `<option value="${value.code}" group="${group}">${value.label}</option>`;
              }
              return str;
            })(field.fields, field.code)
          });

        default :
        htmlOptions += `<option value="${field.code}">${field.label}</option>`;
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
      $('section#transaction .mapping-table').append(htmlFormat.transaction.table.body(""));
      fields.forEach(row => {
        $('section#transaction .mapping-table tbody').append(htmlFormat.transaction.table.row(getField(source.fieldinfos), getField(target.fieldinfos)))
        $('section#transaction .mapping-table tr:last').find('[name="target-field"]').val(row.target.value).change();
        if(row.source.type == 'subtable'){
          $('section#transaction .mapping-table tr:last').find('[name="data-type"]').val(row.source.value.type).change();
          $('section#transaction .mapping-table tr:last').find('[name="source-field"]').val(row.source.value.value).change();
        }else{
          $('section#transaction .mapping-table tr:last').find('[name="data-type"]').val(row.source.type).change();
          $('section#transaction .mapping-table tr:last').find('[name="source-field"]').val(row.source.value).change();
        }
      });
    }else{
      $('section#transaction .mapping-table').append(htmlFormat.transaction.table.body(htmlFormat.transaction.table.row(getField(vars.source.fieldinfos), getField(vars.target.fieldinfos))));
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
      $('section#summary .mapping-table').append(htmlFormat.summary.table.body(""));
      summary.mapping.forEach(row => {
        $('section#summary .mapping-table tbody').append(htmlFormat.summary.table.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos)))
        
        $('section#summary .mapping-table tr:last').find('[name="target-field"]').val(row.target).change();
        $('section#summary .mapping-table tr:last').find('[name="source-field"]').val(row.source).change();
        
        console.log(vars.summary.sum.fields.fieldinfos[row.source])

        if(vars.summary.tran.fields.fieldinfos[row.source]['type'] == "DATE"){
          $('section#summary .mapping-table tr:last').find('[name="format-field"]').val(row.format).change();
        }else{
          $('section#summary .mapping-table tr:last').find('[name="format-field"]').attr('disabled', 'disabled')
        }

      });
    }else{
      $('section#summary .mapping-table').append(htmlFormat.summary.table.body(htmlFormat.summary.table.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos))));
      $('.checkbox-cond').removeClass('hidden');
    }      
  }
  
  function reloadPeriod(period){
    // console.log(period)
    if(period.length > 0){
      $('section#summary .period-table').append(htmlFormat.summary.periodTable.body(""));
      period.forEach(row => {
        $('section#summary .period-table tbody').append(htmlFormat.summary.periodTable.row(getField(vars.summary.tran.fields.fieldinfos)))
        
        $('section#summary .period-table tr:last').find('[name="source-field"]').val(row.source).change();
        $('section#summary .period-table tr:last').find('[name="period-field"]').val(row.period).change();
      });

      if(period.length == 1){
        $('section#summary .period-table tr:last').find('.kintoneplugin-button-remove-row-image').hide()
      }
    }else{
      $('section#summary .period-table').append(htmlFormat.summary.periodTable.body(htmlFormat.summary.periodTable.row(
        getField(vars.summary.tran.fields.fieldinfos))));
      $('.checkbox-cond').removeClass('hidden');
    }      
  }

  function reloadSummaryPlus(fields){
    if(fields.length > 0){
      $(`section#summary .plus-table`).append(htmlFormat.summary.plusTable.body(""));
      fields.forEach(row => {
        $(`section#summary .plus-table tbody`).append(htmlFormat.summary.plusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos)))
        
        $(`section#summary .plus-table tr:last`).find('[name="target-field"]').val(row.target).change();
        $(`section#summary .plus-table tr:last`).find('[name="cond-value"]').val(row.cond).change();
      });

      if(fields.length == 1){
        $('section#summary .plus-table tr:last').find('.kintoneplugin-button-remove-row-image').hide()
      }
    }else{
      $('section#summary .plus-table').append(htmlFormat.summary.plusTable.body(htmlFormat.summary.plusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos))))
      $('.checkbox-cond').removeClass('hidden');
    }      
  }

  function reloadSummaryMinus(fields){
    if(fields.length > 0){
      $(`section#summary .minus-table`).append(htmlFormat.summary.minusTable.body(""));
      fields.forEach(row => {
        $(`section#summary .minus-table tbody`).append(htmlFormat.summary.minusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos)))
        
        $(`section#summary .minus-table tr:last`).find('[name="target-field"]').val(row.target).change();
        $(`section#summary .minus-table tr:last`).find('[name="cond-value"]').val(row.cond).change();
      });

      if(fields.length == 1){
        $('section#summary .minus-table tr:last').find('.kintoneplugin-button-remove-row-image').hide()
      }
    }else{
      $('section#summary .minus-table').append(htmlFormat.summary.minusTable.body(htmlFormat.summary.minusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos))))
      $('.checkbox-cond').removeClass('hidden');
    }      
  }

  $(document).ready(async function(){
    /*---------------------------------------------------------------
    initialize fields
    ---------------------------------------------------------------*/
    vars['apps'] = await loadApps()
    vars['source'] = await loadFields(AppID);

    $('section#transaction select[name="target-app"]').append(getAppOptions(vars.apps));
    
    $('section#summary select[name="transaction-app"]').append(getAppOptions(vars.apps));
    $('section#summary select[name="summary-app"]').append(getAppOptions(vars.apps));
    
    if(CONF.summary.app.source && CONF.summary.app.target){
      $('section#summary select[name="transaction-app').val(CONF.summary.app.source).change();
      $('section#summary select[name="summary-app').val(CONF.summary.app.target).change();
    }

    if(CONF.targetID){
      $('section#transaction select[name="target-app"]').val(CONF.targetID).change();
    }

  });

  /*---------------------------------------------------------------
    Event function
    ---------------------------------------------------------------*/
  // reload target fields
  $('select[name="target-app"]').on('change', async function(){
    vars['target'] = await loadFields($(this).val());
    targetID = $('select[name="target-app"]').find(':selected').val();

    if(vars.target.hasUnique){
      $('.unique-message').html("");
      $('.cond-table').empty();
      $('section#transaction .mapping-table').empty();
      
      $('.unique-field').html(htmlFormat.transaction.unique(getUniqueField(vars.target.fieldinfos)));

      if(CONF.uniqueField){
        $('select[name="unique-field"]').val(CONF.uniqueField).change();  
      }
    }else{
      $('.unique-message').html('* The target app must have unique fields.');
      $('section#transaction .mapping-table').empty();
      $('.cond-table').empty();
      $('.unique-field').empty();
    }
  });

  // Set table
  $('.js-submit-settings').on('change', 'select[name="unique-field"]', function(e){  
    let config = kintone.plugin.app.getConfig(PLUGIN_ID);
    $('section#transaction .mapping-table').empty();
    $('.cond-table').empty();

    // console.log(CONF)
    if(!vars.setting.reloaded){
      if(CONF.uniqueField){
        if(CONF.uniqueField == $('select[name="unique-field"]').val()){
          if('conditions' in CONF){
            reloadCondition(JSON.parse(CONF.conditions));
          }else{
            $('.checkbox-cond').removeClass('hidden');
          }
          if('fieldinfos' in CONF){
            reloadField(JSON.parse(CONF.fieldinfos), vars.source, vars.target);
          }
        }
      }else{
        $('.checkbox-cond').removeClass('hidden');

        $('section#transaction .mapping-table').append(htmlFormat.transaction.table.body(htmlFormat.transaction.table.row(getField(vars.source.fieldinfos), getField(vars.target.fieldinfos))));
        $('section#transaction .mapping-table .kintoneplugin-button-remove-row-image').addClass('hidden');
      }
      vars['setting']['reloaded'] = true;
    }else{
      $('.checkbox-cond').removeClass('hidden');

      $('section#transaction .mapping-table').append(htmlFormat.transaction.table.body(htmlFormat.transaction.table.row(getField(vars.source.fieldinfos), getField(vars.target.fieldinfos))));
      $('section#transaction .mapping-table .kintoneplugin-button-remove-row-image').addClass('hidden');
    }
  });

  // Add
  $('section#transaction .mapping-table').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('tr').after(htmlFormat.transaction.table.row(getField(vars.source.fieldinfos), getField(vars.target.fieldinfos)));
    $('section#transaction .mapping-table .kintoneplugin-button-remove-row-image').removeClass('hidden');
  })
  
  // Remove
  $('section#transaction .mapping-table').on('click', '.kintoneplugin-button-remove-row-image', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $('section#transaction .mapping-table .kintoneplugin-button-remove-row-image').addClass('hidden');
    }
    $(this).closest('tr').remove();
  })

  $('.checkbox-cond').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('.checkbox-cond').addClass('hidden');
    $('.cond-table').append(htmlFormat.condition.table.body(htmlFormat.condition.table.row(getCondField(vars.source.fieldinfos))));
  })

  $('.cond-table').on('click', '.kintoneplugin-button-add-row-image.cond', function(){
    $(this).closest('tr').after(htmlFormat.condition.table.row(getCondField(vars.source.fieldinfos)));
  })
  
  // Add
  $('section#summary .mapping-table').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('tr').after(htmlFormat.summary.table.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos)));
    $($(this).closest('tbody').find('tr')).each(function(){
      ($(this).find('.kintoneplugin-button-remove-row-image')).show()
    })
  })
  
  // Remove
  $('section#summary .mapping-table').on('click', '.kintoneplugin-button-remove-row-image', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $($(this).closest('tbody').find('tr').find('.kintoneplugin-button-remove-row-image')).hide()
    }
    $(this).closest('tr').remove();
  })

   // Add
   $('section#summary .period-table').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('tr').after(htmlFormat.summary.periodTable.row(getField(vars.summary.tran.fields.fieldinfos)));
    $($(this).closest('tbody').find('tr')).each(function(){ 
      ($(this).find('.kintoneplugin-button-remove-row-image')).show()
    })
  })
  
  // Remove
  $('section#summary .period-table').on('click', '.kintoneplugin-button-remove-row-image', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $($(this).closest('tbody').find('tr').find('.kintoneplugin-button-remove-row-image')).hide()
    }
    $(this).closest('tr').remove();
  })

  // Add
  $('section#summary .plus-table').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('tr').after(htmlFormat.summary.plusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos)));
    $($(this).closest('tbody').find('tr')).each(function(){ 
      ($(this).find('.kintoneplugin-button-remove-row-image')).show()
    })
  })
  
  // Remove
  $('section#summary .plus-table').on('click', '.kintoneplugin-button-remove-row-image', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $($(this).closest('tbody').find('tr').find('.kintoneplugin-button-remove-row-image')).hide()
    }
    $(this).closest('tr').remove();
  })

  // Add
  $('section#summary .minus-table').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('tr').after(htmlFormat.summary.minusTable.row(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos)));
    $($(this).closest('tbody').find('tr')).each(function(){ 
      ($(this).find('.kintoneplugin-button-remove-row-image')).show()
    })
  })
  
  // Remove
  $('section#summary .minus-table').on('click', '.kintoneplugin-button-remove-row-image', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $($(this).closest('tbody').find('tr').find('.kintoneplugin-button-remove-row-image')).hide()
    }
    $(this).closest('tr').remove();
  })

  $('.cond-table').on('click', '.kintoneplugin-button-remove-row-image.cond', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    // console.log(rowCount);
    if(rowCount == 1){
      $('.cond-table').empty();
      $('.checkbox-cond').removeClass('hidden')
    }else{
      $(this).closest('tr').remove();
    }
  })

  $('section#transaction .mapping-table').on('change', 'select[name="data-type"]', function(){
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

  $('section#summary select[name="transaction-app"], section#summary select[name="summary-app"]').on('change', async function(){
    vars['summary']['tran']['appID'] = $('section#summary select[name="transaction-app"]').find(':selected').val();
    
    if(vars['summary']['tran']['appID'] != 'null'){
      vars['summary']['tran']['fields'] = await loadFields(vars['summary']['tran']['appID']);
    }

    vars['summary']['sum']['appID'] = $('section#summary select[name="summary-app"]').find(':selected').val();
    if(vars['summary']['sum']['appID'] != 'null'){
      vars['summary']['sum']['fields'] = await loadFields(vars['summary']['sum']['appID']);
    }

    $('section#summary .mapping-table').empty()
    $('section#summary .period-table').empty()
    $('section#summary .summary-field').empty()

    if(vars['summary']['tran']['appID'] != 'null' && vars['summary']['sum']['appID'] != 'null'){
      reloadSummary(CONF.summary)
      reloadPeriod(CONF.summary.period)

      $('section#summary .summary-field').append(htmlFormat.summary.summaryField(getField(vars.summary.tran.fields.fieldinfos), getField(vars.summary.sum.fields.fieldinfos)))
      $('section#summary [name="sum-source-field"]').val(CONF.summary.summary.source).change()
      $('section#summary [name="sum-target-field"]').val(CONF.summary.summary.target).change()
    }
  });

  $('section#summary').on('change', '.summary-field select[name="sum-source-field"], .summary-field select[name="sum-target-field"]', function(){
    $('section#summary .plus-table').empty()
    $('section#summary .minus-table').empty()
    if($('section#summary .summary-field select[name="sum-source-field"]').find(':selected').val() != 'null' && $('section#summary .summary-field select[name="sum-target-field"]').find(':selected').val() != 'null'){
      reloadSummaryPlus(CONF.summary.plus)
      reloadSummaryMinus(CONF.summary.minus)
    }
  });

  $('section#summary .mapping-table').on('change', 'select[name="source-field"]', function(){
    let val = $(this).val()
    console.log(vars.summary.tran.fields.fieldinfos[val]['type'])
    if(vars.summary.tran.fields.fieldinfos[val]['type'] != "DATE"){
      $('section#summary .mapping-table tr:last').find('[name="format-field"]').attr('disabled', 'disabled')
    }else{
      $('section#summary .mapping-table tr:last').find('[name="format-field"]').removeAttr('disabled')
    }
  });

  $form.on('submit', function(e) {
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

    $('section#transaction .mapping-table tbody tr').each(function(){
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
    $('section#summary .mapping-table tbody tr').each(function(){

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
    $('section#summary .period-table tbody tr').each(function(){

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

    summary['summary']['source'] = $('select[name="sum-source-field"]').find(':selected').val();
    summary['summary']['target'] = $('select[name="sum-target-field"]').find(':selected').val();
    
    // Plus
    summary['plus'] = []
    $('section#summary .plus-table tbody tr').each(function(){

      let element = {
        'target' : $(this).find('[name="target-field"]'),
        'cond' : $(this).find('[name="cond-value"]'),
      }

      if( element['target'].val() == 'null' || element['cond'].val() == 'null'){
        alert('Cond can\'t set field be null');
        check = false;
        return;
      }

      summary.plus.push({
        'target': element['target'].val(), 
        'cond': element['cond'].val(), 
      });

    })

    // Minus
    summary['minus'] = []
    $('section#summary .minus-table tbody tr').each(function(){

      let element = {
        'target' : $(this).find('[name="target-field"]'),
        'cond' : $(this).find('[name="cond-value"]'),
      }

      if( element['target'].val() == 'null' || element['cond'].val() == 'null'){
        alert('Cond can\'t set field be null');
        check = false;
        return;
      }

      summary.minus.push({
        'target': element['target'].val(), 
        'cond': element['cond'].val(), 
      });

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
