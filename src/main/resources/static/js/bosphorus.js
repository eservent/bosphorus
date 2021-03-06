$(document ).on( "tabsload", function( event, ui ) {
  console.log(ui);
  ui.panel.enhanceWithin();
});

$("[data-bsp-role='pager']").off().on("change", function(e) {
	  console.log("Pager change");
	  $(document).trigger("bsp_pager_change", e.target) 
});

$(function () {
	  var token = $("meta[name='_csrf']").attr("content");
	  var header = $("meta[name='_csrf_header']").attr("content");
	  $(document).ajaxSend(function(e, xhr, options) {
	    xhr.setRequestHeader(header, token);
	  });
	});

function loadPopup(it, div) {
	var target = $(it)
	setTimeout(function() { 
		$.mobile.loading("show") })
	$(div).load(target.attr("data-bsp-popup-href"), function() { $.mobile.loading("hide") }).enhanceWithin().popup({
		afterclose: function() { $(this).remove() }
	})
}

function registerPagination(file, parent, size) {
	console.log(this)
}

function changeListPage(event, file, parent, value, size) {
	event.preventDefault()
	console.log("loading " + parent)
	$.ajax({url:file + "?limit=" + size + " + &start=" + value, success: function(response) {
        $(parent).replaceWith($(response).find(parent))
        $(parent).enhanceWithin()
        lazyLoadResourceStatus()
    }})
}

function chainPopup(id, nextId, uri) {
	$( id ).popup( 'close' );  
    $( id ).bind({popupafterclose: function(event, ui) 
            { 
                $( nextId ).popup({afterclose: function() {
                	$(this).remove() }}).popup( 'open' )
                }
            });     
}

function refreshPagedContent(pager) {
	$(pager).trigger('change');
}

function initPager(pager, uri, target, wrapper) {
	$(pager).off('change').change(function(event) {
		changeListPage(event, uri, wrapper, event.target.value, 10);
		console.log("change " + target)
	})
	var max = parseInt($(target).attr('data-bsp-pages'), 10);
	$(pager).attr('max', max)
	$(pager).spinbox({"max":max, "dmax":max});
}

function toast(msg){
	$("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><h3>"+msg+"</h3></div>")
	.css({ display: "block", 
		opacity: 0.90, 
		position: "fixed",
		padding: "7px",
		"text-align": "center",
		width: "270px",
		left: ($(window).width() - 284)/2,
		top: $(window).height()/2 })
	.appendTo( $.mobile.pageContainer ).delay( 5000 )
	.fadeOut( 1000, function(){
		$(this).remove();
	});
}

function longPoll(pager) {
		console.log("(Re)initializing long poll")
	   setTimeout(function() {
	       $.ajax({ url: "/events?type=*&subtype=*&timeout=30000", success: function(data) {
	    	   console.log("Got data from long poll " + data)
	    	   var resourceId = data.resourceId;
	    	   if(data.type == "RESOURCE" && data.subtype == "CHANGE") {
	    		   console.log("Got change event for " + resourceId);
	    		   $("[data-bsp-resourceId='" + resourceId + "']").attr("data-bsp-dirty", "true");
	    		   lazyLoadResourceStatus();
	    	   } else
	    		   refreshPagedContent(pager);
	       }, dataType: "json", complete: function() { longPoll(pager) }
	    }, 30000);
	})
}

function setMachineStatusForElement(element, status) {
	element.text(status);
	var cls;
	switch(status) {
	case "On":
		cls = "status-on";
		break;
	case "Off":
		cls = "status-off";
		break;
	case "Expired":
		cls = "status-expired";
		break;
	default:
		cls = "status-unknown";
	}
	element.attr("class", cls)
}

function lazyLoadResourceStatus() {
	$("[data-bsp-lazy='true']").each(function() {
		console.log("inner lazy")
		if(!$(this).attr("data-bsp-dirty") == "true")
			return;
		$(this).attr("data-bsp-dirty", "false");
		var id = $(this).attr("data-bsp-resourceId");
		var td = $(this)
		 $.ajax({ 
			 url: "/rest/passthrough/catalog-service/api/consumer/resourceViews/" + id, success: function(data) {
			 		setMachineStatusForElement(td, data.status)
       			}, 
       		dataType: "json"})
	})
}
