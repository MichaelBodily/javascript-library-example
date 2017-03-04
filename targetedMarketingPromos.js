/* targeted marketing promotion library */
(function (global, $) {
    "use strict";
    
    var TargetedMarketingPromos = function () {
        return new TargetedMarketingPromos.init();
    };
    var _device;
    var _marketingToken;
    var _imageSlots;
    var _currPage;
    var _webApiUrl = location.protocol + "//" + location.hostname + "/TargetedMarketingWebAPI/CurrentPromotions";
    TargetedMarketingPromos.prototype = {
        determineDevice: function () {
            if (/Android|webOS|iPhone|iPad|iPod|iOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                _device = "mobile";
                _marketingToken = $.cookie("CONNECT-GUID");  // TODO: get cookie from mobile
            } else {
                _device = "browser";
                _marketingToken = $.cookie("CONNECT-GUID");
            }
            return this;    // make chainable
        },
        
        determineCurrentPage: function () {
            
            if (window.location.pathname.split("/").pop().toLowerCase().indexOf("summary.aspx") >= 0) {
                _currPage = "SummaryPage_";
            } else if (window.location.pathname.split("/").pop().toLowerCase().indexOf("welcome.aspx") >= 0)  {
                _currPage = "WelcomePage_";
            }
            else if (window.location.pathname.split("/").pop().toLowerCase().indexOf("dashboard.aspx") >= 0)  {
                _currPage = "DashboardPage_";
            } else {
                _currPage = null;
            }
 
            return this;    // make chainable
        },
        fetchCurrentPage: function() {
            return _currPage;
        },
 
        fetchMarketingData: function () {
            // call the controller
            if (_imageSlots.length > 0) {
                $.ajax(
                        {
                            cache: false,
                            context: this,
                            dataType: "json",
                            error: this.TargetedMarketingPromosDataFailureHandler,
                            success: this.TargetedMarketingPromosDataSuccessHandler,
                            type: "GET",
                            xhrFields: { withCredentials: false },
                            headers: {},
                            data: {
                                MemberAccount: TargetedMarketingPromosAccountNumber,
                                MarketingToken: _marketingToken,
                                LocalTime: new Date().toJSON().slice(0, 10),
                                ChannelName: "Web Logged In",
                                ImageContainerNames: _imageSlots
                            },
                            url: _webApiUrl
                        }
                    );
            }
        },
 
        TargetedMarketingPromosDataSuccessHandler: function (reply) {
            var str = JSON.stringify(reply, null, 4); // (Optional) beautiful indented output.
            console.info(str); // Logs output to dev tools console.
 
            if (reply === "undefined" || reply.length === 0 || reply.Containers === null) {
                return;
            } else {
                // we received a successful reply with containers
                var data = {};
                for (var x = 0; x < reply.Containers.length; x++) {
                    if (reply.Containers[x].ContainerName.indexOf(_currPage) !== -1) {
                        var index = reply.Containers[x].ContainerName.charAt(reply.Containers[x].ContainerName.length - 1);
                        data["img_slot_" + index] = reply.Containers[x].Images[0].URL;
                        data["href_slot_" + index] = reply.Containers[x].Images[0].OnClickAction;
                    }
                }
                for (var i = 1; i < 40; i++) {
                    // populate images:
                    if (!this.stringIsNullOrEmpty(data['img_slot_' + i])) {
                        $.get(data['img_slot_' + i])
                            .done(function(j) {
                                return function() {
                                    $("#img_slot_" + j).attr("src", data['img_slot_' + j]);
                                    $("#chicklet_slot_" + j).show("slow");
                                }
                            }(i)).fail(function(k) {
                                return function() {
                                    $("#img_slot_" + k).attr("src", "../assets/img/base/placeholder.png");
                                    $("#chicklet_slot_" + k).attr("style", "display:none;");
                                }
                            }(i));
                    }
                    // populate hrefs:
                    if (!this.stringIsNullOrEmpty(data['href_slot_' + i])) {
                        $("#href_slot_" + i).attr("href", data['href_slot_' + i]);
                    } else {
                        $("#href_slot_" + i).attr("href", "#");
                    }
                }
            }
        },
        TargetedMarketingPromosDataFailureHandler: function () {
            console.info("Got here: TargetedMarketingPromosDataFailureHandler");     // fail silently
        },
        setSlotNumbers: function (slots) {
            _imageSlots = slots;
            
        },
        stringIsNullOrEmpty: function (sString) {
            return (typeof sString === "undefined" || sString === null || sString.length === 0);
        }
    }; // end prototype.
    TargetedMarketingPromos.init = function () {
        var self = this;
    }
    TargetedMarketingPromos.init.prototype = TargetedMarketingPromos.prototype;
    global.TargetedMarketingPromos = global.tmp$ = TargetedMarketingPromos;
}(window, jQuery));
 
 $(document).ready(function () {
     var tmp = tmp$();
     tmp.determineCurrentPage();
     var marketingArry = [];
     $('[targeted-marketing]').each(function () {
         marketingArry.push($(this).attr('targeted-marketing'));
     });
//     tmp.setSlotNumbers([tmp.fetchCurrentPage() + "Slot_1"]);
     tmp.setSlotNumbers(marketingArry);
     tmp.determineDevice().fetchMarketingData();
});