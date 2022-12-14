jQuery.noConflict();

(function($, PLUGIN_ID) {
  'use strict';

  // const
  const AppID = kintone.app.getId();

  const ignoreField = ['id', 'status', 'app_id', 'ref_record_no'];

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
  var htmlCondOption = "";
  
  var htmlSourceOption = "";

  var $form = $('.js-submit-settings');
  var $cancelButton = $('.js-cancel-button');

  // var $message = $('.js-text-message');
  // if (!($form.length > 0 && $cancelButton.length > 0 && $message.length > 0)) {
  //   throw new Error('Required elements do not exist.');
  // }
  
  var fieldinfos = [];
  var targetID = "";
  
  $(document).ready(function(){
    /*---------------------------------------------------------------
    initialize fields
    ---------------------------------------------------------------*/
    // Load apps
    kintone.api(kintone.api.url('/k/v1/apps', true), 'GET', {}, function(resp) {
      let config = kintone.plugin.app.getConfig(PLUGIN_ID);
      $.each(resp.apps, function(index, values){
        if(values.appId != kintone.app.getId()){
          $('select[name="target-app"]').append($('<option>').attr('value',values.appId).text(values.name));
        }
      })
      if (config.targetID) {
        $('select[name="target-app"]').val(config.targetID).change();
        $('select[name="unique-field"]').val(config.uniqueField).change();  
      }
    });

    let optionGroup = [];
    // Load source fields
    htmlCondOption = "";
    kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', {
      'app': AppID
    }, function(resp) {
      $.each(resp.properties, function(index, values){
        console.log(values)
        switch(values.type){
          case 'CATEGORY':
          case 'CREATED_TIME':
          case 'CREATOR':
          case 'FILE':
          case 'MODIFIER':
          case 'REFERENCE_TABLE':
          case 'STATUS_ASSIGNEE':
          case 'UPDATED_TIME':
          case 'RECORD_NUMBER':
            break;
          case 'STATUS':
            htmlCondOption += `<option value="${values.code}">${values.label}</option>`;
            break;
          case 'SUBTABLE':
            console.log(values);
            optionGroup.push({
              'label': values.label,
              'value': values.code,
              'options': ((fields, group) => {
                let str = "";
                for (const [key, value] of Object.entries(fields)) {
                  str += `<option value="${value.code}" group="${group}">${value.label}</option>`;
                }
                return str;
              })(values.fields, values.code)
            });

          default :
            htmlSourceOption += `<option value="${values.code}">${values.label}</option>`;
            if(values.type != "DATE")
              htmlCondOption += `<option value="${values.code}">${values.label}</option>`;
        }
      })

      optionGroup.forEach(element => {
        htmlSourceOption += htmlOptionGroup(element.label, element.options)
      });
    });
  });

  /*---------------------------------------------------------------
    Event function
    ---------------------------------------------------------------*/
  // reload target fields
  $('select[name="target-app"]').on('change', function(){

    var isExistUnique = false;
    targetID = $('select[name="target-app"]').find(':selected').val();
    let config = kintone.plugin.app.getConfig(PLUGIN_ID);

    htmlTargetOption = "";
    htmlUniqueOption = "";
    kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', {
      'app': targetID
    }, function(resp) {
      // var tableBody = "";
      fieldinfos = [];
      console.log(resp);
      $.each(resp.properties, function(index, values){
        switch(values.type){
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
            if('unique' in values){
              if(values.unique){
                isExistUnique = true;
                htmlUniqueOption += `<option value="${values.code}">${values.label}</option>`;
              }
            }
            htmlTargetOption += `<option value="${values.code}">${values.label}</option>`;
            
            // if(!ignoreField.includes(values.code)){
            //   fieldinfos.push({
            //     'from': "",
            //     'to': values.code
            //   })
            //   tableBody += htmlTableRow(values, htmlSourceOption)
            // }
        }
      })

      if(isExistUnique){
        $('.unique-message').html("");
        $('.cond-table').empty();
        $('.mapping-table').empty();
        
        $('.unique-field').html(htmlUniqueSection(htmlUniqueOption));
        if (config.uniqueField && targetID == config.targetID) {
          $('select[name="unique-field"]').val(config.uniqueField).change();  
        }
      }else{
        $('.unique-message').html('* The target app must have unique fields.');
        $('.unique-field').empty();
        $('.cond-table').empty();
        $('.mapping-table').empty();
      }
    }, function(error) {});
  });

  $('.js-submit-settings').on('change', 'select[name="unique-field"]', function(e){  
    let config = kintone.plugin.app.getConfig(PLUGIN_ID);
    $('.mapping-table').empty();
    $('.cond-table').empty();
    if(config.uniqueField != $('select[name="unique-field"]').val()){
      $('.cond-table').append(htmlCondTable(htmlCondTableRow(htmlCondOption)));
      $('.mapping-table').append(htmlTable(htmlTableRow(htmlSourceOption, htmlTargetOption)));
      $('.kintoneplugin-button-remove-row-image').addClass('hidden');
    }else{
      if('fieldinfos' in config){
        let fields = JSON.parse(config.fieldinfos);      
        if(fields.length > 0){
          $('.mapping-table').append(htmlTable(""));
          (JSON.parse(config.fieldinfos)).forEach(element => {
            // console.log(element);
            $('.mapping-table tbody').append(htmlTableRow(htmlSourceOption, htmlTargetOption))
            $('.mapping-table tr:last').find('[name="target-field"]').val(element.target.value).change();
            if(element.source.type == 'subtable'){
              // console.log(element);
              $('.mapping-table tr:last').find('[name="data-type"]').val(element.source.value.type).change();
              $('.mapping-table tr:last').find('[name="source-field"]').val(element.source.value.value).change();
            }else{
              $('.mapping-table tr:last').find('[name="data-type"]').val(element.source.type).change();
              $('.mapping-table tr:last').find('[name="source-field"]').val(element.source.value).change();
            }
          });
        }else{
          $('.mapping-table').append(htmlTable(htmlTableRow(htmlSourceOption, htmlTargetOption)));
          $('.kintoneplugin-button-remove-row-image').addClass('hidden');
        }      
      }
      if('conditions' in config){
        let fields = JSON.parse(config.conditions);      
        if(fields.length > 0){
          $('.cond-table').append(htmlCondTable(""));
          (JSON.parse(config.conditions)).forEach(element => {
            // console.log(element);
            $('.cond-table tbody').append(htmlCondTableRow(htmlCondOption))
            $('.cond-table tr:last').find('[name="cond-field"]').val(element.field).change();
            
            $('.cond-table tr:last').find('[name="operator"]').val(element.operator).change();
            $('.cond-table tr:last').find('[name="cond-value"]').val(element.value).change();
          });
        }else{
          $('.cond-table').append(htmlCondTable(htmlCondTableRow(htmlCondOption)));
          $('.kintoneplugin-button-remove-row-image.cond').addClass('hidden-cond');
        }  
      }else{
        $('.cond-table').append(htmlCondTable(htmlCondTableRow(htmlCondOption)));
        $('.kintoneplugin-button-remove-row-image.cond').addClass('hidden-cond');
      }
    }
  });

  $('.mapping-table').on('click', '.kintoneplugin-button-add-row-image', function(){
    $(this).closest('tr').after(htmlTableRow(htmlSourceOption, htmlTargetOption));
    $('.kintoneplugin-button-remove-row-image').removeClass('hidden');
  })
  
  $('.mapping-table').on('click', '.kintoneplugin-button-remove-row-image', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $('.kintoneplugin-button-remove-row-image').addClass('hidden');
    }
    $(this).closest('tr').remove();
  })

  $('.cond-table').on('click', '.kintoneplugin-button-add-row-image.cond', function(){
    $(this).closest('tr').after(htmlCondTableRow(htmlCondOption));
    $('.kintoneplugin-button-remove-row-image.cond').removeClass('hidden');
  })
  
  $('.cond-table').on('click', '.kintoneplugin-button-remove-row-image.cond', function(){
    var rowCount = $(this).closest('tbody').find('tr').length;
    if(rowCount == 2){
      $('.kintoneplugin-button-remove-row-image.cond').addClass('hidden');
    }
    $(this).closest('tr').remove();
  })

  $('.mapping-table').on('change', 'select[name="data-type"]', function(){
    let type = $('option:selected', this).attr('value');
    // console.log(type);
    if(type == 'select'){
      $($(this).closest('tr').find('.source-field .kintoneplugin-table-td-control-value')[0]).html(`
        <div class="kintoneplugin-select-outer">
          <div class="kintoneplugin-select source-field">
            <select name="source-field">
              <option value="null" selected hidden></option>
              ${htmlSourceOption}
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

  $form.on('submit', function(e) {
    let hasSubtable = false;

    e.preventDefault();
    // console.log(targetID);
    // console.log($('select[name="unique-field"]').val());
    fieldinfos = [];
    var conditions = [];
    let check = true;

    $('.cond-table tbody tr').each(function(){
      // console.log($(this).find('[name="source-field"]').val());
      // console.log($(this).find('[name="target-field"]').val());
      // console.log($(this).find('[name="data-type"]').val());
      let element = {
        'field' : $(this).find('[name="cond-field"]'),
        'operator' : $(this).find('[name="operator"]'),
        'value' :  $(this).find('[name="cond-value"]'),
      }

      console.log($(this).closest('tbody').find('tr').length)

      if($(this).closest('tbody').find('tr').length > 1 && check){
        if( element['field'].val() == 'null' || element['operator'].val() == 'null' || element['value'].val() == ''){
          alert('Cond can\'t set field be null');
          check = false;
          return;
        }
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

    console.log(fieldinfos)
    console.log(conditions)

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
