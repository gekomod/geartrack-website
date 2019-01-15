/**
 * SORRY BRO, THIS CODE IS A MESS!
 * I NEED TO FIND TIME TO CONVERT THIS TO REACT!
 */
'use strict'

/*
 |--------------------------------------------------------------------------
 | Global vars
 |--------------------------------------------------------------------------
 */
var form = $('#controlForm'),
  shippingId = $('#shipping_id'),
  content = $('#content'),
  popup = $('#addTrack'),
  description = $('#description'),
  trackEntries = $('#track-entries'),
  emptyList = $('#emptyList'),
  info = $('#info'),
  jumbotron = $('#hide-info')

var tracks = []

/*
 |--------------------------------------------------------------------------
 | Templates
 |--------------------------------------------------------------------------
 */
var trackEntryTemplate = Handlebars.compile($('#track-list-template').html()),
  trackContentTemplate = Handlebars.compile(
    $('#track-content-template').html(),
    { noEscape: true }
  ),
  skyTemplate = Handlebars.compile($('#sky-template').html()),
  seurTemplate = Handlebars.compile($('#seur-template').html()),
  correosTemplate = Handlebars.compile($('#correos-template').html()),
  //correosOldTemplate = Handlebars.compile($('#correos-old-template').html()),
  adicionalTemplate = Handlebars.compile($('#adicional-template').html()),
  //expresso24Template = Handlebars.compile($('#expresso24-template').html()),
  cttTemplate = Handlebars.compile($('#ctt-template').html()),
  ppTemplate = Handlebars.compile($('#pp-template').html()),
  aliExpressTemplate = Handlebars.compile($('#ali-template').html()),
  nacexTemplate = Handlebars.compile($('#nacex-template').html()),
  failedTemplate = Handlebars.compile($('#failed-template').html()),
  cainiaoEmpty = Handlebars.compile($('#cainiao-empty-template').html()),
  rangelTemplate = Handlebars.compile($('#rangel-template').html())

/*
 |--------------------------------------------------------------------------
 | Page functionality
 |--------------------------------------------------------------------------
 */
storageLoadAll()
addAllTracksToPage()

var help_block2 = $('#help_block'),
  form_group = $('#id-input')

var idInvalidString = 'Esse tipo de ID ainda não é suportado <i class="fa fa-frown-o"></i>, fala connosco para adicionarmos!',
  idMaybeNotValid = 'Esse id parece ser o order number da Gearbest, não será o <strong>tracking number</strong> que pretendes? <i class="fa fa-smile-o"></i>'

shippingId.on('input paste', function() {
  var inserted = $(this)
    .val()
    .trim()
    .replace(/[^\x00-\x7F]/, '') // remove non asci chars

  $(this).val(inserted) // update the input

  if (inserted.length == 0) {
    inputFeedback('', null, false)
    return
  }

  if (isValidID(inserted)) {
    // if (/^038[0-9]+$/.test(inserted)) {
    //   inputFeedback('has-warning', idSEURnum, true)
    //   return
    // }

    inputFeedback('has-success', null, false)
  } else {
    if (/^W.+$/.test(inserted)) {
      inputFeedback('has-error', idMaybeNotValid, true)
      return
    }

    if (/^EU.+$/.test(inserted)) {
      inputFeedback('has-error', idEUDpd, true)
      return
    }

    inputFeedback('has-error', idInvalidString, true)
  }
})


function inputFeedback (classType, message, showHelp) {
  form_group.attr('class', 'form-group ' + classType)

  if (message)
    help_block2.html(message)

  if (showHelp)
    help_block2.show()
  else
    help_block2.hide()
}

/**
 * Add track
 */
form.submit(function(event) {
  event.preventDefault()

  var id = shippingId
      .val()
      .trim()
      .toUpperCase(),
    desc = description.val().trim()

  if (!isValidID(id) || desc.length == 0) {
    alert('Tem de inserir um ID válido e uma descrição.')
    return
  }

  if (/^MPS.+/.test(id)) {
    id = id.replace('MPS', '')
  }

  var track = new Track(id, capitalizeFirstLetter(desc))
  var lastOrder = 0
  if (tracks.length > 0) {
    lastOrder = tracks[tracks.length - 1].order
    if (isNaN(lastOrder)) lastOrder = 0
  }
  console.log('last order:', lastOrder)

  track.order = lastOrder - 1

  if (storageAddTrack(track)) {
    // new one
    loadTrackToContent(track)
    tracks.push(track)
  } else {
    alert('Esse id já foi adicionado!')
  }

  form_group.toggleClass('has-success', false)
  help_block2.hide()

  shippingId.val('')
  description.val('')
  popup.modal('hide')

  jumbotron.hide()
  localStorage.setItem('info5', 0)
})

$(document).on('click', '.clickToGo', function(e) {
  var id = $(this)
    .siblings('p')
    .text()
  console.log(id)
  var offset = $('#' + id).offset().top - 55

  $('html, body').animate(
    {
      scrollTop: offset
    },
    500
  )
})

/**
 * Remove track
 * Event listener for the remove functionality
 * catches dynamically added elements aswell
 */
$(document).on('click', '.remove', function(e) {
  e.preventDefault()

  var id = $(this).data('id')
  $(this)
    .closest('li')
    .remove()
  $('#' + id).remove()

  storageRemoveTrack(id)

  if (tracks.length == 0) {
    info.show()
    jumbotron.show()
    localStorage.removeItem('info5')
    emptyList.show()
  }
})

if (localStorage.getItem('info5') == null) {
  jumbotron.show()
}

$('#hide-button').click(function(e) {
  e.preventDefault()

  jumbotron.hide()
  localStorage.setItem('info5', 0)
})

$(document).on('click', '.track .panel-heading', function(e) {
  var id = $(this)
    .find('.right-id')
    .text()
  var body = $(this).siblings('.panel-body')

  var trackEntity = null
  for (var i = 0; i < tracks.length; ++i) {
    if (tracks[i].id == id) {
      trackEntity = tracks[i]
      break
    }
  }

  var isCollapsed = trackEntity.collapsed
  trackEntity.collapsed = !isCollapsed

  if (isCollapsed) {
    body.slideDown()
  } else {
    body.slideUp()
  }

  if (isCollapsed) {
    //We only need data when the tracking is collapsed and will be shown
    if (!trackEntity.loaded) {
      console.log('ID: ' + trackEntity.id + ' not loaded, starting loading.')
      startLoadingTracker(trackEntity)
    } else {
      console.log('ID: ' + trackEntity.id + ' already loaded, ignoring.')
    }
  }

  saveEntityInStorage(trackEntity)
})

trackEntries.sortable({
  handle: '.move',
  onDrop: onDropItem
})

var orderInfo = $('#order-info')

function onDropItem($item, container, _super, event) {
  var idsOrder = []
  trackEntries.children().each(function() {
    var elem = $(this)
    var id = elem.find('p').text()

    if (id) idsOrder.push(id)
  })
  console.log(idsOrder)

  for (var i = 0; i < tracks.length; ++i) {
    tracks[i].order = idsOrder.indexOf(tracks[i].id)
    saveEntityInStorage(tracks[i])
  }

  orderInfo.slideDown()

  _super($item, container)
}
/*
 |--------------------------------------------------------------------------
 | Content info logic
 |--------------------------------------------------------------------------
 */
function loadTrackToContent(trackEntity) {
  addEntryToPage(trackEntity)
  addEntryToContent(trackEntity)

  trackEntity.loaded = false
  startLoadingTracker(trackEntity)
}

function startLoadingTracker(trackEntity) {
  var elId = $('#' + trackEntity.id),
    elBody = elId.find('.panel-body')

  if (trackEntity.collapsed) {
    elBody.hide()
    return
  }

  trackEntity.loaded = true

  var ending =
    trackEntity.id.charAt(trackEntity.id.length - 2) +
    trackEntity.id.charAt(trackEntity.id.length - 1)

  if (trackEntity.id.length >= 22 && /^007\d+/.test(trackEntity.id)) {
    if (/.+001$/.test(trackEntity.id)) {
      trackEntity.id = trackEntity.id.substring(0, trackEntity.id.length - 3)
    }
    loadAliProvider(elBody, trackEntity, 'tourlineexpress', false)
    return
  }

  if (ending == 'GB') {
    loadRoyalMailTracker(elBody, trackEntity)
    return
  }

  if (ending == 'PT') {
    loadCttProvider(elBody, trackEntity)
    return
  }

  if (/^[KWT]{3}[A-Z]{2}[0-9]{10}YQ$/.test(trackEntity.id)) {
    loadDoubleAliProvider(elBody, trackEntity, 'general', 'flytExpress', true)
    return
  }

  if (/^EE.+$/.test(trackEntity.id) && trackEntity.id.length >= 20) {
    loadAliProvider(elBody, trackEntity, 'postalNinja', false, true)
    return
  }

  if (/-.+EE$/.test(trackEntity.id)) {
    loadAliProvider(elBody, trackEntity, 'seur', false, true)
    return
  }

  if (/^TSLNL.+/.test(trackEntity.id)) {
    loadAliProvider(elBody, trackEntity, 'postNL', true, false)
    return
  }

  if (/^UD.+NL$/.test(trackEntity.id)) {
    loadSkyAndOther(elBody, trackEntity, 'postNL')
    return
  }

  if (/^U.+CN$/.test(trackEntity.id)) {
    // loadDoubleAliProvider(elBody, trackEntity, 'sky56', 'trackchinapost', true)
    loadSkyAndAliProvider(elBody, trackEntity, 'general', 'pp')
    return
  }

  if (/^CNCID.+$/.test(trackEntity.id)) {
    loadAliProvider(elBody, trackEntity, 'dhlecommerce', false)
    return
  }

  if (/^BFD.+/.test(trackEntity.id)) {
    loadAliProvider(elBody, trackEntity, 'seur', false, true)
    return
  }

  if (/^SEU.+/.test(trackEntity.id)) {
    loadAliProvider(elBody, trackEntity, 'seur', false, true)
    return
  }

  if (/^PW-.+/.test(trackEntity.id)) {
    loadAliProvider(elBody, trackEntity, 'seur', false, true)
    return
  }

  if (/^SGLBY.+/.test(trackEntity.id)) {
    loadAliProvider(elBody, trackEntity, 'dhlecommerce', true)
    return
  }

  if (/^ZW.+/.test(trackEntity.id)) {
    loadAliProvider(elBody, trackEntity, 'gls', false)
    return
  }

  if (/^BLVS.+/.test(trackEntity.id)) {
    loadAliProvider(elBody, trackEntity, 'bpost', false)
    return
  }

  if (/^NR.+/.test(trackEntity.id)) {
    loadNetherlandsPost(elBody, trackEntity)
    return
  }

  if (/^NL.+$/.test(trackEntity.id)) {
    loadNetherlandsPost(elBody, trackEntity)
    return
  }

  if (/^ES.+/.test(trackEntity.id)) {
    loadAliProvider(elBody, trackEntity, 'rangel', false)
    return
  }

  if (/^SU.+/.test(trackEntity.id)) {
    loadSuSeurProvider(elBody, trackEntity)
    notifyNewId(trackEntity.id)
    return
  }

  if (/^P\d+$/.test(trackEntity.id)) {
    loadSkyAndAliProvider(elBody, trackEntity, 'singpost')
    return
  }

  if (/^F\d+$/.test(trackEntity.id)) {
    loadAliProvider(elBody, trackEntity, 'flytExpress', false)
    return
  }

  switch (trackEntity.id.charAt(0)) {
    case '1':
      if (trackEntity.id.charAt(1) == 'Z') {
        loadDoubleAliProvider(elBody, trackEntity, 'th_origin', 'ups', false)
      } else if (/^1550.+/.test(trackEntity.id)) {
        loadTripleAliProvider(
          elBody,
          trackEntity,
          'chronopost',
          'dpdde',
          'dpduk',
          false
        )

        getProviderData('dpduk_origin', trackEntity.id)
          .then(function(data) {
            elBody.find('.c-aligeneral4').append(aliExpressTemplate(data))
          })
          .catch(function(error) {})
      } else {
        loadDefaultTracker(elBody, trackEntity)
      }
      break
    case 'A':
      if (/^A[0-9]+$/.test(trackEntity.id)) {
        loadDefaultTracker(elBody, trackEntity)
      } else if (/^A.+P$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'flytExpress', false)
      } else {
        loadAliProvider(elBody, trackEntity, 'yanwen', false)
      }
      break
    case 'B':
      if (ending == 'CN') {
        loadTripleAliProvider(
          elBody,
          trackEntity,
          'general',
          'postalNinja',
          'cainiao',
          false
        )
      } else {
        loadTripleAliProvider(
          elBody,
          trackEntity,
          'general',
          'postalNinja',
          'cainiao',
          false
        )
      }
      break
    case 'C':
      if (/^C.+PT$/.test(trackEntity.id)) {
        loadCttProvider(elBody, trackEntity)
      } else if (/^C.+DE$/.test(trackEntity.id)) {
        loadTripleAliProvider(
          elBody,
          trackEntity,
          'dhlde_origin',
          'dhlde',
          'dhlparcel',
          false
        )
      } else if (/^C.+FR$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'general', true, true)
      } else {
        loadTripleAliProvider(
          elBody,
          trackEntity,
          'general',
          'postalNinja',
          'trackchinapost',
          true
        )
      }
      break
    case 'D':
      if (ending == 'PT') {
        loadCttProvider(elBody, trackEntity)
      } else if (/^DH.+$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'cainiao')
      } else {
        loadDefaultTracker(elBody, trackEntity)
      }

      break
    case 'I':
      loadAliProvider(elBody, trackEntity, 'winit', false)
      break
    case 'E':
      if (trackEntity.id.charAt(1) == 'Y') {
        loadDefaultTracker(elBody, trackEntity)
      } else if (ending == 'SG') {
        loadAliProvider(elBody, trackEntity, 'singpost', true)
      } else if (ending == 'PT') {
        loadCttProvider(elBody, trackEntity)
      } else {
        loadDefaultTracker(elBody, trackEntity)
      }
      break
    case 'N':
    case 'L':
      if (/^L.+NL$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'postNL')
      } else if (/^L.+CN$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'cainiao', false)
      } else if (/^L.+PT$/.test(trackEntity.id)) {
        loadCttProvider(elBody, trackEntity)
      } else if (/^L.+SE$/.test(trackEntity.id)) {
        loadDoubleAliProvider(
          elBody,
          trackEntity,
          'postalNinja',
          'directlink',
          true
        )
      } else if (/^LP.+$/.test(trackEntity.id)) {
        // loadYanwen(elBody, trackEntity)
        //   loadDefaultTracker(elBody, trackEntity)
        loadDoubleAliProvider(elBody, trackEntity, 'pp', 'cainiao',false)
      } else if (/^LA.+$/.test(trackEntity.id)) {
        loadDefaultTracker(elBody, trackEntity)
      } else if (/^LV.+$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'bpost', false)
      } else if (/^LB.+$/.test(trackEntity.id)) {
        loadPPProvider(elBody, trackEntity, 'pp', false)
      }else {
        loadDefaultTracker(elBody, trackEntity)
      }
      break
    case 'S':
    case 'G':
      if (/^SB.+/.test(trackEntity.id)) {
        loadSBSwitzerlandPost(elBody, trackEntity)
      } else if (/^S\d+/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'cainiao', false)
      } else if (/^SY[a-zA-Z0-9]+$/.test(trackEntity.id)) {
        loadSkyAndAliProvider(elBody, trackEntity, 'malaysiaPos')
      } else if (/^GE.+$/.test(trackEntity.id)) {
        loadSkyAndAliProvider(elBody, trackEntity, 'malaysiaPos') // malasya pos
      } else if (/^G.+PT$/.test(trackEntity.id)) {
        loadCttProvider(elBody, trackEntity)
        break
      } else {
        loadDefaultTracker(elBody, trackEntity)
      }
      break
    case 'P':
      if (/^PQ.+$/.test(trackEntity.id)) {
        loadSpainExpress(elBody, trackEntity)
      } else {
        loadDefaultTracker(elBody, trackEntity)
      }

      break
    case 'K':
      loadDefaultTracker(elBody, trackEntity)
      break
    case 'U':
      if (/^UPA.+$/.test(trackEntity.id)) {
        loadDoubleAliProvider(
          elBody,
          trackEntity,
          'general',
          'pitneybowes',
          false
        )
      } else if (/^U[a-zA-Z0-9]+SE$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'directlink', false)
      } else if (/^U.+YP$/.test(trackEntity.id)) {
        loadYanwen(elBody, trackEntity)
      } else {
        loadDefaultTracker(elBody, trackEntity)
      }
      break
    case 'R': // Aliexpress
      switch (ending) {
        case 'MY':
          loadPPProvider(
            elBody,
            trackEntity,
            'pp',
            'cainiao',
            true
          ) //malasya pos
          break
        case 'SE':
          loadDoubleAliProvider(
            elBody,
            trackEntity,
            'directlink',
            'flytExpress',
            true
          )
          break
        case 'ES':
          loadAliProvider(elBody, trackEntity, 'correoses', true)
          break
        case 'CN':
          loadTripleAliProvider(
            elBody,
            trackEntity,
            'general',
            'trackchinapost',
            'cainiao',
            true
          )
          break
        case 'NL':
          loadDoubleAliProvider(
            elBody,
            trackEntity,
            'postNL',
            'flytExpress',
            true
          )
          break
        case 'PT':
          loadCttProvider(elBody, trackEntity)
          break
        case 'HU':
          loadDefaultTracker(elBody, trackEntity)
          break
        case 'DE':
          loadTripleAliProvider(
            elBody,
            trackEntity,
            'dhlecommerce',
            'general',
            'dhlde',
            true
          )
          break
        case 'AT':
          loadDefaultTracker(elBody, trackEntity)
          break
        case 'GB':
          loadRoyalMailTracker(elBody, trackEntity)
          break
        case 'LA':
          loadDefaultTracker(elBody, trackEntity)
          break
        case 'IN':
          loadAliProvider(elBody, trackEntity, 'ips', true)
          break
        case 'BE':
          loadAliProvider(elBody, trackEntity, 'bpost', true)
          break
        case 'PL':
          loadPPProvider(elBody, trackEntity, 'pp','cainiao', false)
          break
        case 'SG':
          loadDoubleAliProvider(
            elBody,
            trackEntity,
            'singpost',
            'cainiao',
            true
          )
          break
        default:
          loadDefaultTracker(elBody, trackEntity)
      }
      break
    case 'Q':
      if (/^Q.+X$/.test(trackEntity.id)) {
        loadGBSweden(elBody, trackEntity)
        break
      }
    case 'Y':
      if (trackEntity.id.charAt(1) == 'T') {
        // yun express
        loadDefaultTracker(elBody, trackEntity)
      } else {
        loadAliProvider(elBody, trackEntity, 'yanwen', false)
      }
      break
    case 'T':
      if (/^TH.+$/.test(trackEntity.id)) {
        loadDoubleAliProvider(
          elBody,
          trackEntity,
          'panasia',
          'th_origin',
          false
        )

        if (Math.random() < 0.5) {
          notifyNewId(trackEntity.id)
        }

        break
      }
    case 'O':
      if (/^O.+PT$/.test(trackEntity.id)) {
        loadCttProvider(elBody, trackEntity)
        break
      }
    case 'V':
      if (/^V.+PT$/.test(trackEntity.id)) {
        loadCttProvider(elBody, trackEntity)
        break
      }
    default:
      loadDefaultTracker(elBody, trackEntity)
      break
  }
}

function loadDefaultTracker(elBody, trackEntity) {
  if (/^\d{28}$/.test(trackEntity.id)) {
    loadAliProvider(elBody, trackEntity, 'cacesa', false)
    return
  }

  if (/^\d+[a-zA-Z]{1}$/.test(trackEntity.id)) {
    loadTripleAliProvider(
      elBody,
      trackEntity,
      'chronopost',
      'dpdde',
      'dpduk',
      false
    )
    return
  }

  if (/^\d+$/.test(trackEntity.id)) {
    loadNumbersMultiple(elBody, trackEntity)
  } else {
    loadDoubleAliProvider(elBody, trackEntity, 'general', 'postalNinja', true)
  }

  notifyNewId(trackEntity.id)
}

function notifyNewId(id) {
  return $.post('http://sledzja.pl/api/save', { id: id }).done(function(
    res
  ) {
    console.log(res)
  })
}

/*
 |--------------------------------------------------------------------------
 | Gearbest
 |--------------------------------------------------------------------------
 */
/*
 |--------------------------------------------------------------------------
 | Gearbest
 |--------------------------------------------------------------------------
 */
function loadSpainExpress(elBody, trackEntity) {
  // Make requests at the same time
  var total = 4,
    count = 0

  var skyContainer = elBody.find('.c-sky'),
    panasiaContainer = elBody.find('.c-panasia'),
    correosESContainer = elBody.find('.c-correoses'),
    correosContainer = elBody.find('.c-correos'),
    correosOldContainer = elBody.find('.c-correos-old'),
    expresso24Container = elBody.find('.c-expresso24'),
    rangelContainer = elBody.find('.c-rangel'),
    cttContainer = elBody.find('.c-ctt'),
    adicionalContainer = elBody.find('.c-adicional')

  var rangel = false

  getProviderData('sky', trackEntity.id)
    .then(function(skyData) {
      if (skyData.messages.length > 0) {
        // we only want the messages, the status are equal to correos es
        skyContainer.append(skyTemplate(skyData))
      }

      if (++count == total) removeLoading(elBody)
    })
    .catch(function(error) {
      //skyContainer.append(failedTemplate(error.responseJSON))
      if (++count == total) removeLoading(elBody)
    })

  getProviderData('panasia', trackEntity.id)
    .then(function(skyData) {
      panasiaContainer.append(aliExpressTemplate(skyData))
      skyContainer.hide()
      if (++count == total) removeLoading(elBody)
    })
    .catch(function(error) {
      // panasiaContainer.append(failedTemplate(error.responseJSON))

      if (++count == total) removeLoading(elBody)
    })

  getProviderData('correosesnew', trackEntity.id)
    .then(function(correosData) {
      correosESContainer.append(aliExpressTemplate(correosData))
      if (++count == total) removeLoading(elBody)

      if (correosData.information.associatedId != null) {
        getProviderData('ctt', correosData.information.associatedId)
          .then(function(data) {
            cttContainer.append(cttTemplate(data))
          })
          .catch(function(error) {
            cttContainer.append(failedTemplate(error.responseJSON))
          })
      }

      if (correosData.information.ref != null) {
        getProviderData('rangel', correosData.information.ref)
          .then(function(rangelData) {
            rangel = true
            rangelContainer.append(rangelTemplate(rangelData))
            adicionalContainer.hide()
          })
          .catch(function(error) {})
      }
    })
    .catch(function(error) {
      getProviderData('correoses', trackEntity.id)
        .then(function(correosData2) {
          correosESContainer.append(aliExpressTemplate(correosData2))
          if (++count == total) removeLoading(elBody)
        })
        .catch(function(error2) {
          correosESContainer.append(failedTemplate(error2.responseJSON))
          if (++count == total) removeLoading(elBody)
        })
    })

  if (Math.random() < 0.01) {
    // 1% probability
    // save some PQ ids to verify if the Gearbest changed the Priority Line course
    // new companies delivering, etc
    notifyNewId(trackEntity.id)
  }

  // getProviderData('correoses', trackEntity.id)
  //   .then(function(correosData) {
  //     correosESContainer.append(aliExpressTemplate(correosData))
  //     if (++count == total) removeLoading(elBody)
  //   })
  //   .catch(function(error) {
  //     correosESContainer.append(failedTemplate(error.responseJSON))
  //     if (++count == total) removeLoading(elBody)
  //   })

  // getProviderData('ctt', trackEntity.id)
  //   .then(function(cttData) {
  //     cttContainer.append(cttTemplate(cttData))
  //     if (++count == total) removeLoading(elBody)
  //   })
  //   .catch(function(error) {
  //     cttContainer.append(failedTemplate(error.responseJSON))
  //     if (++count == total) removeLoading(elBody)
  //   })

  getCorreosData(trackEntity.id, trackEntity.postalcode)
    .then(function(correosData) {
      correosContainer.append(correosTemplate(correosData))

      if (++count == total) removeLoading(elBody)
    })
    .catch(function(error) {
      // correosContainer.append(failedTemplate(error.responseJSON))
      if (++count == total) removeLoading(elBody)
    })

  // getCorreosOldData(trackEntity.id, trackEntity.postalcode)
  //   .then(function(correosData) {
  //     getProviderData('rangel', correosData.product.ref)
  //       .then(function(rangelData) {
  //         rangel = true
  //         rangelContainer.append(rangelTemplate(rangelData))
  //         adicionalContainer.hide()
  //         removeLoading(elBody)
  //       })
  //       .catch(function(error) {
  //         rangelContainer.append(failedTemplate(error.responseJSON))
  //         removeLoading(elBody)
  //       })
  //   })
  //   .catch(function(errorCorreos) {})

  // var adicionalId = trackEntity.id.slice(0, -3)
  // getAdicionalData(adicionalId, trackEntity.postalcode)
  //   .then(function(adicionalData) {
  //     addAdicionalToPage(adicionalData)
  //   })
  //   .catch(function(error) {
  //     if (rangel == false) {
  //       // some adicional data is only obtained from the correos old info
  //       getCorreosOldData(trackEntity.id, trackEntity.postalcode)
  //         .then(function(correosData) {
  //           getAdicionalData(correosData.id, trackEntity.postalcode)
  //             .then(function(newData) {
  //               addAdicionalToPage(newData)
  //             })
  //             .catch(function(errorAd) {
  //               // adicionalContainer.append(failedTemplate(errorAd.responseJSON))
  //               if (++count == total) removeLoading(elBody)
  //             })
  //         })
  //         .catch(function(errorCorreos) {
  //           // adicionalContainer.append(failedTemplate(error.responseJSON))
  //           if (++count == total) removeLoading(elBody)
  //         })
  //     }
  //   })
  //
  // function addAdicionalToPage(adicionalData) {
  //   if (++count == total) removeLoading(elBody)
  //
  //   // Hide the second phone if is the same
  //   if (adicionalData.phone2 == adicionalData.phone1)
  //     adicionalData.phone2 = null
  //
  //   if (adicionalData.status == 'DESCARTADO') {
  //     adicionalContainer.append(
  //       failedTemplate({
  //         provider: 'Adicional',
  //         error: 'Estado descartado.',
  //         color: 'success'
  //       })
  //     )
  //   } else {
  //     adicionalContainer.append(adicionalTemplate(adicionalData))
  //   }
  // }
}

function loadNetherlandsPost (elBody, trackEntity) {
  var skyContainer = elBody.find('.c-sky')

  getProviderData('sky', trackEntity.id).then(function (data) { // add sky response to the page
    skyContainer.append(skyTemplate(data))
    removeLoading(elBody)
  }).catch(function (error) {
    skyContainer.append(failedTemplate(error.responseJSON))
    removeLoading(elBody)
  })
}

function loadSBSwitzerlandPost (elBody, trackEntity) {
  // Make both requests at the same time
  var total = 2,
    count = 0

  var alicontainer = elBody.find('.c-aligeneral'),
    skyContainer = elBody.find('.c-sky')

  getProviderData('sky', trackEntity.id).then(function (data) { // add sky response to the page
    skyContainer.append(skyTemplate(data))
    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    skyContainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData('cjah', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))
    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
}

function loadSkyAndAliProvider (elBody, trackEntity, provider) {
  // Make both requests at the same time
  var total = 2,
    count = 0

  var alicontainer = elBody.find('.c-aligeneral'),
    skyContainer = elBody.find('.c-sky')

  getProviderData('sky', trackEntity.id).then(function (data) { // add sky response to the page
    skyContainer.append(skyTemplate(data))
    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    skyContainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData(provider, trackEntity.id).then(function (data) {
    if (provider == 'cainiao' && data.states.length == 0) {
      alicontainer.append(cainiaoEmpty(data))
    } else {
      alicontainer.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
}

/*
 |--------------------------------------------------------------------------
 | Aliexpress
 |--------------------------------------------------------------------------
 */
function loadAliProvider(
  elBody,
  trackEntity,
  provider,
  showCtt,
  showFailedTemplateOnError
) {
  if (typeof showCtt === 'undefined') showCtt = true
  if (typeof showFailedTemplateOnError === 'undefined')
    showFailedTemplateOnError = true

  // Make both requests at the same time
  var total = showCtt ? 2 : 1,
    count = 0

  var alicontainer = elBody.find('.c-aligeneral'),
    cttContainer = elBody.find('.c-ctt')

  if (showCtt) {
    getProviderData('ctt', trackEntity.id)
      .then(function(data) {
        cttContainer.append(cttTemplate(data))
        if (++count == total) removeLoading(elBody)
      })
      .catch(function(error) {
        if (showFailedTemplateOnError)
          cttContainer.append(failedTemplate(error.responseJSON))
        if (++count == total) removeLoading(elBody)
      })
  }

  getProviderData(provider, trackEntity.id)
    .then(function(data) {
      if (provider == 'cainiao' && data.states.length == 0) {
        alicontainer.append(cainiaoEmpty(data))
      } else {
        if (provider == 'seur') {
          alicontainer.append(seurTemplate(data))
        } else {
          alicontainer.append(aliExpressTemplate(data))
        }
      }

      if (++count == total) removeLoading(elBody)
    })
    .catch(function(error) {
      if (showFailedTemplateOnError)
        alicontainer.append(failedTemplate(error.responseJSON))
      if (++count == total) removeLoading(elBody)
    })
}

function loadSuSeurProvider(elBody, trackEntity) {
  var alicontainer = elBody.find('.c-aligeneral')
  var panasiaContainer = elBody.find('.c-panasia')

  getProviderData('panasia', trackEntity.id)
    .then(function(skyData) {
      panasiaContainer.append(aliExpressTemplate(skyData))
    })
    .catch(function(error) {
      getProviderData('panasia', trackEntity.id.slice(0, -1))
        .then(function(data) {
          panasiaContainer.append(aliExpressTemplate(data))
        })
        .catch(function(error2) {
          panasiaContainer.append(failedTemplate(error.responseJSON))
        })
    })

  getProviderData('seur', trackEntity.id)
    .then(function(data) {
      alicontainer.append(seurTemplate(data))

      removeLoading(elBody)
    })
    .catch(function(error) {
      // remove last char
      getProviderData('seur', trackEntity.id.slice(0, -1))
        .then(function(data2) {
          alicontainer.append(seurTemplate(data2))

          removeLoading(elBody)
        })
        .catch(function(error2) {
          alicontainer.append(failedTemplate(error2.responseJSON))
          removeLoading(elBody)
        })
    })
}


function loadGBSweden (elBody, trackEntity) {
  var total = 2, count = 0

  var alicontainer = elBody.find('.c-aligeneral'),
    cttContainer = elBody.find('.c-ctt'),
    skyContainer = elBody.find('.c-sky')

  getProviderData('sky', trackEntity.id).then(function (data) {
    skyContainer.append(skyTemplate(data))
    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    skyContainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData('directlink', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))

    getProviderData('ctt', data.id).then(function (data2) {
      cttContainer.append(cttTemplate(data2))
    }).catch(function (error) {
      cttContainer.append(failedTemplate(error.responseJSON))
    })

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

}

function loadCttProvider (elBody, trackEntity) {
  var cttContainer = elBody.find('.c-ctt')

  getProviderData('ctt', trackEntity.id).then(function (data) {
    cttContainer.append(cttTemplate(data))
    removeLoading(elBody)
  }).catch(function (error) {
    cttContainer.append(failedTemplate(error.responseJSON))
    removeLoading(elBody)
  })
}

function loadPPProvider (elBody, trackEntity) {
  var alicontainer = elBody.find('.c-aligeneral2'),
    aliContainer2 = elBody.find('.c-aligeneral3'),
    aliContainer1 = elBody.find('.c-aligeneral1'),
    aliContainer4 = elBody.find('.c-aligeneral4'),
    aliContainerG = elBody.find('.c-aligeneral'),
    aliContainer5 = elBody.find('.c-aligeneral5'),
    aliContainer6 = elBody.find('.c-aligeneral6'),
    aliContainer7 = elBody.find('.c-aligeneral7'),
    aliContainer8 = elBody.find('.c-aligeneral8'),
    aliContainer9 = elBody.find('.c-aligeneral9'),
    aliContainer10 = elBody.find('.c-aligeneral10'),
    aliContainer11 = elBody.find('.c-aligeneral11'),
    cttContainer = elBody.find('.c-ctt'),
    ppContainer = elBody.find('.c-pp')
  
    var total = 2,
    count = 0

  getProviderData('pp', trackEntity.id).then(function (data) {
    ppContainer.append(ppTemplate(data))
    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    ppContainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
    
  getProviderData('cainiao', trackEntity.id).then(function (data) {
    if (data.states.length > 0) {
      aliContainer2.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)

    if (data.destinyId) {
      getProviderData('ctt', data.destinyId).then(function (data) {
        cttContainer.append(cttTemplate(data))
      }).catch(function (error) {
      })
    }
  }).catch(function (error) {
    aliContainer2.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
}

/*
 |--------------------------------------------------------------------------
 | Yanwen provider
 |--------------------------------------------------------------------------
 */
function loadYanwen (elBody, trackEntity) {
  // Make both requests at the same time
  var total = 2,
    count = 0

  var alicontainer = elBody.find('.c-aligeneral2'),
    aliContainer2 = elBody.find('.c-aligeneral3'),
    cttContainer = elBody.find('.c-ctt')

  getProviderData('yanwen', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))
    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData('cainiao', trackEntity.id).then(function (data) {
    if (data.states.length > 0) {
      aliContainer2.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)

    if (data.destinyId) {
      getProviderData('ctt', data.destinyId).then(function (data) {
        cttContainer.append(cttTemplate(data))
      }).catch(function (error) {
      })
    }
  }).catch(function (error) {
    aliContainer2.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
}

function loadDoubleAliProvider (elBody, trackEntity, provider1, provider2, showCtt) {
  if (typeof (showCtt) === 'undefined') showCtt = true

  // Make both requests at the same time
  var total = showCtt ? 3 : 2,
    count = 0

  var alicontainer = elBody.find('.c-aligeneral'),
    alicontainer2 = elBody.find('.c-aligeneral2'),
    cttContainer = elBody.find('.c-ctt'),
    ppContainer = elBody.find('.c-pp')

  if (showCtt) {
    getProviderData('ctt', trackEntity.id).then(function (data) {
      cttContainer.append(cttTemplate(data))
      if (++count == total) removeLoading(elBody)
    }).catch(function (error) {
      cttContainer.append(failedTemplate(error.responseJSON))
      if (++count == total) removeLoading(elBody)
    })
  }

  getProviderData(provider1, trackEntity.id).then(function (data) {
    if (provider1 == 'cainiao' && data.states.length == 0) {
        if(provider1 == 'pp') {
            ppContainer.append(ppTemplate(data))
      
        } else {
            alicontainer.append(cainiaoEmpty(data))
        }
    } else {
      alicontainer.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData(provider2, trackEntity.id).then(function (data) {
    if (provider2 == 'cainiao' && data.states.length == 0) {
      alicontainer2.append(cainiaoEmpty(data))
    } else {
      alicontainer2.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer2.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
}

function loadDoublePPProvider (elBody, trackEntity, provider1, provider2, showCtt) {
  if (typeof (showCtt) === 'undefined') showCtt = true

  // Make both requests at the same time
  var total = showCtt ? 3 : 2,
    count = 0

  var alicontainer = elBody.find('.c-aligeneral'),
    alicontainer2 = elBody.find('.c-aligeneral2'),
    cttContainer = elBody.find('.c-ctt'),
    ppContainer = elBody.find('.c-pp')

  if (showCtt) {
    getProviderData('ctt', trackEntity.id).then(function (data) {
      cttContainer.append(cttTemplate(data))
      if (++count == total) removeLoading(elBody)
    }).catch(function (error) {
      cttContainer.append(failedTemplate(error.responseJSON))
      if (++count == total) removeLoading(elBody)
    })
  }

  getProviderData(provider1, trackEntity.id).then(function (data) {
    if (provider1 == 'pp') {
            ppContainer.append(ppTemplate(data))
    } else {
      alicontainer.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData(provider2, trackEntity.id).then(function (data) {
    if (provider2 == 'cainiao' && data.states.length == 0) {
      alicontainer2.append(cainiaoEmpty(data))
    } else {
      alicontainer2.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer2.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
}

function loadTripleAliProvider (elBody, trackEntity, provider1, provider2, provider3, showCtt) {
  if (typeof (showCtt) === 'undefined') showCtt = true

  // Make both requests at the same time
  var total = showCtt ? 4 : 3,
    count = 0

  var alicontainer = elBody.find('.c-aligeneral'),
    alicontainer2 = elBody.find('.c-aligeneral2'),
    alicontainer3 = elBody.find('.c-aligeneral3'),
    cttContainer = elBody.find('.c-ctt')

  if (showCtt) {
    getProviderData('ctt', trackEntity.id).then(function (data) {
      cttContainer.append(cttTemplate(data))
      if (++count == total) removeLoading(elBody)
    }).catch(function (error) {
      cttContainer.append(failedTemplate(error.responseJSON))
      if (++count == total) removeLoading(elBody)
    })
  }

  getProviderData(provider1, trackEntity.id).then(function (data) {
    if (provider1 == 'cainiao' && data.states.length == 0) {
      alicontainer.append(cainiaoEmpty(data))
    } else {
      alicontainer.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData(provider2, trackEntity.id).then(function (data) {
    if (provider2 == 'cainiao' && data.states.length == 0) {
      alicontainer2.append(cainiaoEmpty(data))
    } else {
      alicontainer2.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer2.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData(provider3, trackEntity.id).then(function (data) {
    if (provider3 == 'cainiao' && data.states.length == 0) {
      alicontainer3.append(cainiaoEmpty(data))
    } else {
      alicontainer3.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer3.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
}

/*
 |--------------------------------------------------------------------------
 | Multiple (All numbers)
 |--------------------------------------------------------------------------
 */
function loadNumbersMultiple (elBody, trackEntity) {
// Make both requests at the same time
  var total = 0,
    count = 0,
    success = 0

  var alicontainer = elBody.find('.c-aligeneral2'),
    aliContainer2 = elBody.find('.c-aligeneral3'),
    aliContainer1 = elBody.find('.c-aligeneral1'),
    aliContainer4 = elBody.find('.c-aligeneral4'),
    aliContainerG = elBody.find('.c-aligeneral'),
    aliContainer5 = elBody.find('.c-aligeneral5'),
    aliContainer6 = elBody.find('.c-aligeneral6'),
    aliContainer7 = elBody.find('.c-aligeneral7'),
    aliContainer8 = elBody.find('.c-aligeneral8'),
    aliContainer9 = elBody.find('.c-aligeneral9'),
    aliContainer10 = elBody.find('.c-aligeneral10'),
    aliContainer11 = elBody.find('.c-aligeneral11'),
    cttContainer = elBody.find('.c-ctt'),
    ppContainer = elBody.find('.c-pp')
  
  // var seurId = trackEntity.id
  if (/^03[78]\d{10,11}$/.test(trackEntity.id)) {
    // seurId = trackEntity.id.substr(1)
    total++
    getProviderData('seur', trackEntity.id)
      .then(function(data) {
        aliContainer7.append(aliExpressTemplate(data))
        success++
        removeLoading(elBody)
        if (++count == total) failed()
      })
      .catch(function(error) {
        if (++count == total) failed()
      })
  } else {
    // total++
    // getProviderData('trackchinapost', trackEntity.id)
    //   .then(function(data) {
    //     aliContainerG.append(aliExpressTemplate(data))
    //     success++
    //     removeLoading(elBody)
    //     if (++count == total) failed()
    //   })
    //   .catch(function(error) {
    //     if (++count == total) failed()
    //   })

      total++
      getProviderData('origin', trackEntity.id)
          .then(function(data) {
              aliContainer6.append(aliExpressTemplate(data))
              success++
              removeLoading(elBody)
              if (++count == total) failed()
          })
          .catch(function(error) {
              if (++count == total) failed()
          })

    // FedEx
    // if (
    //   matchAnyRegex(
    //     [
    //       /^[0-9]{9,10}$/,
    //       /^[0-9]{12}$/,
    //       /^[0-9]{14,15}$/,
    //       /^[DK|FY]{2}[0-9]{14}$/,
    //       /^[0-9]{20}$/,
    //       /^[0-9]{22}$/,
    //       /^[0-9]{34}$/
    //     ],
    //     trackEntity.id
    //   )
    // ) {
    //   total++
    //   getProviderData('fedex', trackEntity.id)
    //     .then(function(data) {
    //       success++
    //       aliContainer4.append(aliExpressTemplate(data))
    //       removeLoading(elBody)
    //       if (++count == total) failed()
    //     })
    //     .catch(function(error) {
    //       if (++count == total) failed()
    //     })
    // }
  }

    if (/^01\d{11}$/.test(trackEntity.id)) {
        total++
        getProviderData('vaspexpresso', trackEntity.id)
            .then(function(data) {
                aliContainer5.append(aliExpressTemplate(data))
                success++
                removeLoading(elBody)
                if (++count == total) failed()
            })
            .catch(function(error) {
                if (++count == total) failed()
            })
    }

  total++
    getProviderData('hermes', trackEntity.id)
    .then(function(data) {
      aliContainer11.append(aliExpressTemplate(data))
      success++
      removeLoading(elBody)
      if (++count == total) failed()
    })
    .catch(function(error) {
      if (++count == total) failed()
    })

  total++
  getProviderData('nacex', trackEntity.id)
    .then(function(data) {
      aliContainer11.append(nacexTemplate(data))
      success++
      removeLoading(elBody)
      if (++count == total) failed()
    })
    .catch(function(error) {
      if (++count == total) failed()
    })

  total++
  getProviderData('dhles', trackEntity.id)
    .then(function(data) {
      aliContainer8.append(aliExpressTemplate(data))
      success++
      removeLoading(elBody)
      if (++count == total) failed()
    })
    .catch(function(error) {
      if (++count == total) failed()
    })

  total++
  getProviderData('flytExpress', trackEntity.id)
    .then(function(data) {
      aliContainer9.append(aliExpressTemplate(data))
      success++
      removeLoading(elBody)
      if (++count == total) failed()
    })
    .catch(function(error) {
      if (++count == total) failed()
    })

  total++
  getProviderData('gls', trackEntity.id)
    .then(function(data) {
      aliContainer10.append(aliExpressTemplate(data))
      success++
      removeLoading(elBody)
      if (++count == total) failed()
    })
    .catch(function(error) {
      if (++count == total) failed()
    })

  // skynet
  if (/^00.+/.test(trackEntity.id)) {
    total++
    getProviderData('skynet', trackEntity.id)
      .then(function(data) {
        aliContainer2.append(aliExpressTemplate(data))
        success++
        removeLoading(elBody)
        if (++count == total) failed()
      })
      .catch(function(error) {
        if (++count == total) failed()
      })
  }

  total++
  getProviderData('chronopost', trackEntity.id)
    .then(function(data) {
      aliContainer1.append(aliExpressTemplate(data))
      success++
      removeLoading(elBody)
      if (++count == total) failed()
    })
    .catch(function(error) {
      if (++count == total) failed()
    })

    if (!/^1550.+/.test(trackEntity.id)) {
        total++
        getProviderData('chronopost', '1550' + trackEntity.id)
            .then(function(data) {
                aliContainer1.append(aliExpressTemplate(data))
                success++
                removeLoading(elBody)
                if (++count == total) failed()
            })
            .catch(function(error) {
                if (++count == total) failed()
            })
    }

  total++
  getProviderData('dpdde', trackEntity.id)
    .then(function(data) {
      aliContainer9.append(aliExpressTemplate(data))
      success++
      removeLoading(elBody)
      if (++count == total) failed()
    })
    .catch(function(error) {
      if (++count == total) failed()
    })

  total++
  getProviderData('correosesnew', trackEntity.id)
    .then(function(data) {
      aliContainer7.append(correosTemplate(data))
      success++
      removeLoading(elBody)
      if (++count == total) failed()
    })
    .catch(function(error) {
      if (++count == total) failed()
    })

  total++
  getProviderData('dhlde', trackEntity.id)
    .then(function(data) {
      aliContainer6.append(aliExpressTemplate(data))
      success++
      removeLoading(elBody)
      if (++count == total) failed()
    })
    .catch(function(error) {
      if (++count == total) failed()
    })

  total++
  getProviderData('ctt', trackEntity.id)
    .then(function(data) {
      cttContainer.append(cttTemplate(data))
      success++
      removeLoading(elBody)
      if (++count == total) failed()
    })
    .catch(function(error) {
      if (++count == total) failed()
    })

  total++
  getProviderData('dpduk', trackEntity.id)
    .then(function(data) {
      aliContainer5.append(aliExpressTemplate(data))
      success++
      removeLoading(elBody)
      if (++count == total) failed()
    })
    .catch(function(error) {
      if (++count == total) failed()
    })

  total++

  getProviderData('yanwen', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))
    success++
    removeLoading(elBody)
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('cainiao', trackEntity.id).then(function (data) {
    if (data.states.length > 0) {
      aliContainer2.append(aliExpressTemplate(data))
      success++
      removeLoading(elBody)
    }

    if (++count == total) failed()

    if (data.destinyId) {
      getProviderData('ctt', data.destinyId).then(function (data) {
        cttContainer.append(cttTemplate(data))
      }).catch(function (error) {
      })
    }
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('trackchinapost', trackEntity.id).then(function (data) {
    aliContainerG.append(aliExpressTemplate(data))
    success++
    removeLoading(elBody)
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('dhl', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))
    success++
    removeLoading(elBody)
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })
    
  getProviderData('pp', trackEntity.id).then(function (data) {
    ppContainer.append(ppTemplate(data))
    success++
    removeLoading(elBody)
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('mrw', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))
    success++
    removeLoading(elBody)
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('track24', trackEntity.id).then(function (data) {
    aliContainer4.append(aliExpressTemplate(data))
    success++
    removeLoading(elBody)
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  function failed () {
    if (success == 0) {
      notifyNewId(trackEntity.id)
      aliContainerG.append(failedTemplate({
        provider: 'Nenhum tracker com informação',
        color: 'primary',
        error: 'Não foi encontrado nenhum tracking com informação para esse ID. <br> Fala connosco no Facebook para adicionarmos!',
        link: 'https://www.facebook.com/geartrackpt'
      }))
    }

    removeLoading(elBody)
  }
}

/*
 |--------------------------------------------------------------------------
 | Get Api data
 |--------------------------------------------------------------------------
 */
function getProviderData (provider, id) {
  return $.getJSON('/api/' + provider, {id: id})
}

function getCorreosData (id, code) {
  return $.getJSON('/api/correos', {id: id, postalcode: code})
}

function getCorreosOldData (id, code) {
  return $.getJSON('/api/correosOld', {id: id, postalcode: code})
}

function getAdicionalData (adicionalID, code) {
  return $.getJSON('/api/adicional', {id: adicionalID, postalcode: code})
}

// save unsuported ids to add later
function notifyNewId(id) {
  return $.post('http://sledzja.pl/api/save', { id: id }).done(function(
    res
  ) {
    console.log(res)
  })
}

/*
 |--------------------------------------------------------------------------
 | Page Modifications
 |--------------------------------------------------------------------------
 */
function addEntryToPage (trackEntity) {
  emptyList.hide()
  trackEntries.prepend(trackEntryTemplate({
    description: trackEntity.description,
    id: trackEntity.id,
    postalcode: trackEntity.postalcode
  }))
}

function addEntryToContent (trackEntity) {
  info.hide()
  content.prepend(trackContentTemplate({
    description: trackEntity.description,
    id: trackEntity.id
  }))
}

function addAllTracksToPage () {
  tracks.forEach(function (track) {
    loadTrackToContent(track)
  })
}

function removeLoading (elem) {
  elem.find('.center-img').remove()
}
/*
 |--------------------------------------------------------------------------
 | Entities
 |--------------------------------------------------------------------------
 */
function Track (id, desc) {
  this.id = id
  this.postalcode = this.getPostalCode()
  this.description = desc
}

Track.prototype.getPostalCode = function () {
  if (!this.isPQ()) return null

  var code = ''

  for (var i = this.id.length - 1, max = 0; i >= 0 && max < 4; i--) {
    var char = this.id.charAt(i)

    if (char >= '0' && char <= '9') {
      code = char + code
      max++
    }
  }

  return code
}

Track.prototype.isPQ = function () {
  return this.id.charAt(0) == 'P'
}

/*
 |--------------------------------------------------------------------------
 | Utils
 |--------------------------------------------------------------------------
 */
/**
 * Like sprintf
 * "{0} is dead, but {1} is alive! {0} {2}".format("ASP", "ASP.NET")
 * ASP is dead, but ASP.NET is alive! ASP {2}
 */
if (!String.prototype.format) {
  String.prototype.format = function () {
    var args = arguments
    return this.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match

    })
  }
}

function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function isValidID (id) {
  if (id.length < 3) return false

  // try to load some info from track24 and 17track for unknown ids
  return true
}

function daysAgo (date) {
  var seconds = Math.floor((new Date() - date) / 1000)

  return Math.floor(seconds / 86400) // 60*60*24 1 day in seconds
}

/*
 |--------------------------------------------------------------------------
 | Storage
 |--------------------------------------------------------------------------
 */
function storageAddTrack (trackEntity) {
  if (localStorage.getItem('#' + trackEntity.id) != null)
    return false

  localStorage.setItem('#' + trackEntity.id, JSON.stringify(trackEntity))
  return true
}

function saveEntityInStorage(trackEntity) {
  localStorage.setItem('#' + trackEntity.id, JSON.stringify(trackEntity))
}

function storageRemoveTrack (id) {
  if (tracks.length == 1) { //filter was not working for 1 element
    tracks = []
  } else {
    tracks = tracks.filter(function (t) {
      return t.id !== id
    })
  }

  localStorage.removeItem('#' + id)
}

function storageLoadAll () {
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i)

    if (key.charAt(0) === '#') {
      if (/^[#a-zA-Z0-9]+$/.test(key)) {
        //we only load valid ids
        tracks.push(JSON.parse(localStorage.getItem(key)))
      } else {
        // not valid id, remove
        localStorage.removeItem(key)
      }
    }
  }
}
