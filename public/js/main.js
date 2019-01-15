/*
 |--------------------------------------------------------------------------
 | Main
 |--------------------------------------------------------------------------
 */
'use strict'

$('body').tooltip({
  selector: '[data-toggle="tooltip"]'
})

moment.locale('pl')
var timezone = moment.tz.guess()

/*
 |--------------------------------------------------------------------------
 | Handlebars templates
 |--------------------------------------------------------------------------
 */
Handlebars.registerHelper('HelperFromNow', function(date) {
  if (!date || date == null) return 'Sem data'
  var date = moment(date).tz(timezone)

  var text = date.fromNow()

  if (text == 'há um mês') {
    var today = moment()
    var days = date.diff(today, 'days')
    return 'há ' + -days + ' dias'
  }

  return text
})

Handlebars.registerHelper('HelperDate', function(date) {
  if (!date || date == null) return 'Sem data'
  return moment(date)
    .tz(timezone)
    .format('DD/MM/YYYY')
})

Handlebars.registerHelper('HelperDateWithHours', function(date) {
  if (!date || date == null) return 'Sem data'

  return moment(date)
    .tz(timezone)
    .format('DD/MM/YYYY HH:mm')
})

Handlebars.registerHelper('HelperHours', function(date) {
  if (!date || date == null) return 'Sem data'
  return moment(date)
    .tz(timezone)
    .format('HH:mm')
})

Handlebars.registerHelper('AdicionalId', function(id) {
  return id.slice(0, -3)
})

Handlebars.registerHelper('HelperCapitalize', function(string) {
  var lower = string.toLowerCase()

  if (lower.charAt(0) == '[') {
    // cainiao states have [country] message
    lower = lower.replaceAt(1, lower.charAt(1).toUpperCase())
    var idx = lower.indexOf(']') + 2
    lower = lower.replaceAt(idx, lower.charAt(idx).toUpperCase())
  }

  return lower.charAt(0).toUpperCase() + lower.slice(1)
})

Handlebars.registerHelper('HelperCapitalizeWords', function(string) {
  if (string.length == 2) {
    // uppercase country codes
    return string.toUpperCase()
  }

  string = string.toLowerCase()
  return string.replace(/(?:^|\s)\S/g, function(a) {
    return a.toUpperCase()
  })
})

Handlebars.registerHelper('HelperLowerCase', function(string) {
  return string.toLowerCase()
})

Handlebars.registerHelper('HelperState', function(state, first, insideFirst) {
  var strings = [
    'delivered',
    'entregue',
    'entregado',
    'delivery success',
    'entrega',
    'doręczenie',
    'Likwidacja księgi oddawczej po doręczeniu'
  ]

  for (var i = 0; i < strings.length; i++) {
    if (state.toLowerCase().indexOf(strings[i]) !== -1) {
      return 'delivered'
    }
  }

  if (typeof insideFirst == 'boolean') {
    if (insideFirst && first) return 'new'
  } else {
    if (first) return 'new'
  }

  return ''
})

Handlebars.registerHelper('HelperTrackerSkyPQ', function(skyinfo, options) {
  if (skyinfo.id.indexOf('PQ') != -1) {
    // is PQ
    if (skyinfo.messages.length == 0 && skyinfo.status.length > 0)
      return options.fn(this)

    return options.inverse(this)
  } else {
    return options.fn(this)
  }
})

Handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {
  switch (operator) {
    case '==':
      return v1 == v2 ? options.fn(this) : options.inverse(this)
    case '===':
      return v1 === v2 ? options.fn(this) : options.inverse(this)
    case '!=':
      return v1 != v2 ? options.fn(this) : options.inverse(this)
    case '!==':
      return v1 !== v2 ? options.fn(this) : options.inverse(this)
    case '<':
      return v1 < v2 ? options.fn(this) : options.inverse(this)
    case '<=':
      return v1 <= v2 ? options.fn(this) : options.inverse(this)
    case '>':
      return v1 > v2 ? options.fn(this) : options.inverse(this)
    case '>=':
      return v1 >= v2 ? options.fn(this) : options.inverse(this)
    case '&&':
      return v1 && v2 ? options.fn(this) : options.inverse(this)
    case '||':
      return v1 || v2 ? options.fn(this) : options.inverse(this)
    default:
      return options.inverse(this)
  }
})

/*
 |--------------------------------------------------------------------------
 | String utils
 |--------------------------------------------------------------------------
 */
String.prototype.replaceAt = function(index, replacement) {
  return (
    this.substr(0, index) +
    replacement +
    this.substr(index + replacement.length)
  )
}

$(document).ready(function(){
    var full_path = location.href.split("#")[0];
    $(".nav li a").each(function(){
        var $this = $(this);
        if($this.prop("href").split("#")[0] == full_path) {
            $(this).addClass("active");
        }
    });
});