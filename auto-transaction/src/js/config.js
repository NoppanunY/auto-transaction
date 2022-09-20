jQuery.noConflict();

(function($, PLUGIN_ID) {
  'use strict';

  // const
  const AppID = kintone.app.getId();

  const ignoreField = ['id', 'status', 'app_id', 'ref_record_no'];

  const CONF = kintone.plugin.app.getConfig(PLUGIN_ID);
  
  // Template Html
  const htmlTable = (tableBody) => `
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
  `;
  
  const htmlTableRow = (sourceOptions, targetOptions) => `
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
  `;

  const htmlCondTable = (tableBody) => `
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
  `;

  const htmlCondTableRow = (sourceOptions, targetOptions) => `
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
  `;

  const htmlUniqueSection = (options) => `
    <span>Save Reference Record ID to :&nbsp;</span> 
    <div class="kintoneplugin-select-outer">
      <div class="kintoneplugin-select unique-field">
        <select name="unique-field">
          <option value="null" selected hidden></option>
          ${options}
        </select>
      </div>
    </div>
  `;

  const htmlOptionGroup = (groupName, options) => `
    <optgroup label="${groupName}">
      ${options}
    </optgroup>
  `;

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
    }
  }

  function loadApps(){
    return new Promise((resolve) => {
      let apps = {}
      kintone.api(kintone.api.url('/k/v1/apps', true), 'GET', {})
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
      htmlOptions += htmlOptionGroup(element.label, element.options)
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
      $('.mapping-table').append(htmlTable(""));
      fields.forEach(row => {
        $('.mapping-table tbody').append(htmlTableRow(getField(source.fieldinfos), getField(target.fieldinfos)))
        $('.mapping-table tr:last').find('[name="target-field"]').val(row.target.value).change();
        if(row.source.type == 'subtable'){
          $('.mapping-table tr:last').find('[name="data-type"]').val(row.source.value.type).change();
          $('.mapping-table tr:last').find('[name="source-field"]').val(row.source.value.value).change();
        }else{
          $('.mapping-table tr:last').find('[name="data-type"]').val(row.source.type).change();
          $('.mapping-table tr:last').find('[name="source-field"]').val(row.source.value).change();
        }
      });
    }else{
      $('.mapping-table').append(htmlTable(htmlTableRow(getField(vars.source.fieldinfos), getField(vars.target.fieldinfos))));
      $('.kintoneplugin-button-remove-row-image').addClass('hidden');
    }      
  }

  function reloadCondition(conditions){
    // console.log(conditions);
    if(conditions.length > 0){
      $('.cond-table').append(htmlCondTable(""));
      conditions.forEach(row => {
        // console.log(row);
        $('.cond-table tbody').append(htmlCondTableRow(getCondField(vars.source.fieldinfos)))
        $('.cond-table tr:last').find('[name="cond-field"]').val(row.field).change();
        $('.cond-table tr:last').find('[name="operator"]').val(row.operator).change();
        $('.cond-table tr:last').find('[name="cond-value"]').val(row.value).change();
      });
    }else{
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
    
    $('section#summary select[name="target-app"]').append(getAppOptions(vars.apps));
    $('section#summary select[name="target-app"]').append(getAppOptions(vars.apps));

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
      $('.mapping-table').empty();
      
      $('.unique-field').html(htmlUniqueSection(getUniqueField(vars.target.fieldinfos)));

      if(CONF.uniqueField){
        $('select[name="unique-field"]').val(CONF.uniqueField).change();  
      }
    }else{
      $('.unique-message').html('* The target app must have unique fields.');
      $('.mapping-table').empty();
      $('.cond-table').empty();
      $('.unique-field').empty();
    }
  });

  // Set table
  $('.js-submit-settings').on('change', 'select[name="unique-field"]', function(e){  
    let config = kintone.plugin.app.getConfig(PLUGIN_ID);
    $('.mapping-table').empty();
    $('.cond-table').empty();

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

        $('.mapping-table').append(htmlTable(htmlTableRow(getField(vars.source.fieldinfos), getField(vars.target.fieldinfos))));
        $('.mapping-table .kintoneplugin-button-remove-row-image').addClass('hidden');
      }
      vars['setting']['reloaded'] = true;
    }else{
      $('.checkbox-cond').removeClass('hidden');

      $('.mapping-table').append(htmlTable(htmlTableRow(getField(vars.source.fieldinfos), getField(vars.target.fieldinfos))));
      $('.mapping-table .kintoneplugin-button-remove-row-image').addClass('hidden');
    }
  });

  // Add
  $('.mapping-table').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('tr').after(htmlTableRow(getField(vars.source.fieldinfos), getField(vars.target.fieldinfos)));
    $('.mapping-table .kintoneplugin-button-remove-row-image').removeClass('hidden');
  })
  
  // Remove
  $('.mapping-table').on('click', '.kintoneplugin-button-remove-row-image', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $('.mapping-table .kintoneplugin-button-remove-row-image').addClass('hidden');
    }
    $(this).closest('tr').remove();
  })

  $('.checkbox-cond').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('.checkbox-cond').addClass('hidden');
    $('.cond-table').append(htmlCondTable(htmlCondTableRow(getCondField(vars.source.fieldinfos))));
  })

  $('.cond-table').on('click', '.kintoneplugin-button-add-row-image.cond', function(){
    $(this).closest('tr').after(htmlCondTableRow(getCondField(vars.source.fieldinfos)));
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

  $('.mapping-table').on('change', 'select[name="data-type"]', function(){
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

  $form.on('submit', function(e) {
    let hasSubtable = false;

    e.preventDefault();

    fieldinfos = [];
    var conditions = [];
    let check = true;

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

    $('.mapping-table tbody tr').each(function(){
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

    // console.log(fieldinfos)
    // console.log(conditions)

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
        'conditions': JSON.stringify(conditions, '')
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
