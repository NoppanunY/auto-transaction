jQuery.noConflict();

(function($, PLUGIN_ID) {
  'use strict';

  // const
  const AppID = kintone.app.getId();

  const ignoreField = ['id', 'status', 'app_id', 'ref_record_no'];
  // Html template

  const htmlTable = (table_body) => `
    <table class="kintoneplugin-table">
      <thead>
        <tr>
          <th class="kintoneplugin-table-th"><span class="title">Source</span></th>
          <th class="kintoneplugin-table-th"><span class="title">Target</span></th>
          <th class="kintoneplugin-table-th-blankspace"></th>
        </tr>
      </thead>
      <tbody>
        ${table_body}
      </tbody>
    </table>
  `
  
  const htmlTableRow = (values, fieldTarget) => `
    <tr>
      <td>
        <div class="kintoneplugin-table-td-control">
          <div class="kintoneplugin-table-td-control-value">
            <div class="kintoneplugin-input-outer">
              <input class="kintoneplugin-input-text" name="field-source" id=${values.code} value="${values.label}" disabled/>
            </div>
          </div>
        </div>
      </td>
      <td>
        <div class="kintoneplugin-table-td-control">
          <div class="kintoneplugin-table-td-control-value">
            <div class="kintoneplugin-select-outer">
              <div class="kintoneplugin-select field-target">
                <select name="field-target">
                  <option value="null" ></option>
                  ${fieldTarget}
                </select>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  `

  var $form = $('.js-submit-settings');
  var $cancelButton = $('.js-cancel-button');

  // var $message = $('.js-text-message');
  // if (!($form.length > 0 && $cancelButton.length > 0 && $message.length > 0)) {
  //   throw new Error('Required elements do not exist.');
  // }
  
  var mapping = [];
  var destID = "";

  var fieldTarget = "";
  var config = kintone.plugin.app.getConfig(PLUGIN_ID);

  kintone.api(kintone.api.url('/k/v1/apps', true), 'GET', {}, function(resp) {
    // success
    $.each(resp.apps, function(index, values){
      if(values.appId != kintone.app.getId()){
        $('select[name="app-target"]').append($('<option>').attr('value',values.appId).text(values.name));
      }
    })
    // console.log(resp);
    if (config.destID) {
      $('select[name="app-target"]').val(config.destID).change();
    }
  
  }, function(error) {
    // error
    console.log(error);
  }); // End get app

  var body = {
    'app': AppID
  };

  kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', body, function(resp) {
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
        case 'SUBTABLE':
          break;
          // htmlTable(htmlTableRow())
          // break;
        default :
           fieldTarget += `<option value="${values.code}">${values.label}</option>`;          
      }
    })
    // console.log(resp);
  }, function(error) {
    // error
    console.log(error);
  }); // End get fields app

  $('select[name="app-target"]').on('change', function(){
    
    var table = "";
    destID = $('select[name="app-target"]').find(':selected').val();
    var body = {
      'app': $('select[name="app-target"]').find(':selected').val()
    };
    
    kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', body, function(resp) {
      var table_body = "";
      mapping = [];
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
            if(!ignoreField.includes(values.code))
            {
              mapping.push({
                'from': "",
                'to': values.code
              })
              table_body += htmlTableRow(values, fieldTarget)
            }
        }
      })

      $('.mapping-table').empty();
      $('.mapping-table').append(htmlTable(table_body));

      if('mapping' in config){
        $('.mapping-table tbody tr').each(function(){
          var td = $($(this).find('td')[0]).find('input[name="field-source"]').attr('id');
          
          (JSON.parse(config.mapping)).forEach(element => {
            if(element.from == td){
              $($(this).find('td')[1]).find('select[name="field-target"]').val(element.to).change();
            } 
          });

        })
      }
    }, function(error) {
      // error
      console.log(error);
    });
  }); // End dest on change

  $('.mapping-table').on('change', 'select[name="field-target"]', function(e){
    var to = $(this).closest('tr').find('input[name="field-source"]').attr('id');
    var from = $(this).find(':selected')[0].value;
    for(var i=0; i<mapping.length; i++){
      if(mapping[i].to == to){
        mapping[i].from = from;
      }
    }
  })

  $form.on('submit', function(e) {
    e.preventDefault();
    console.log(mapping)
    kintone.plugin.app.setConfig({'destID': destID,'mapping': JSON.stringify(mapping, '')}, function() {
      alert('The plug-in settings have been saved. Please update the app!');
      window.location.href = '../../flow?app=' + kintone.app.getId();
    });
  });
  $cancelButton.on('click', function() {
    window.location.href = '../../' + kintone.app.getId() + '/plugin/';
  });
})(jQuery, kintone.$PLUGIN_ID);
