// set up targeted marketing js library:
(function (global, $) {

    var TargetedMarketing = function () {
        return new TargetedMarketing.init();
    };

    // private vars
    var _device;
    var _marketingToken;
    var _imageSlots;
    var _webApiUrl;
    var _currIndex = {};
    var _imgDuration = 7000;    // image rotate time in milliseconds
    var _fadeDuration = 500;    // fade time in milliseconds NOTE: This must match the duration set in the css file in the .chicklet-img { transition: opacity .5s; } property
    var _tokenLoaded = false;

    // prototyped methods:
    TargetedMarketing.prototype = {

        determineDevice: function (deviceGuid) {      
            if (/Android|webOS|iPhone|iPad|iPod|iOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                _device = "mobile";
                if (!this.stringIsNullOrEmpty(deviceGuid)) {
                    _marketingToken = this.fetchMarketingToken(deviceGuid).responseJSON;
                } else {
                    _marketingToken = $.cookie("CONNECT-GUID");
		    _tokenLoaded = true;
                }
            } else {
                _device = "browser";
                _marketingToken = $.cookie("CONNECT-GUID");
                _tokenLoaded = true;
            }
            // console.log("_marketingToken = ",_marketingToken);
           
            return this;    // make chainable
        },

        setWebApiUrl: function(value) {
            _webApiUrl = value;
        },


        fetchMarketingData: function () {

            if (_tokenLoaded) {
                // call the controller
                $.ajax(
                    {
                        cache: false,
                        context: this,
                        dataType: "json",
                        error: this.targetedMarketingDataFailureHandler,
                        success: this.targetedMarketingDataSuccessHandler,
                        type: "POST",
                        xhrFields: { withCredentials: false },
                        headers: {},
                        data: {
                            MemberAccount: null,
                            MarketingToken: _marketingToken,
                            LocalTime: new Date().toJSON().slice(0, 10),
                            ChannelName: "Mobile Not Logged In",
                            ImageContainerNames: _imageSlots
                        },
                        url: _webApiUrl
                    }
                );
            }
        },

        fetchMarketingToken: function (deviceIdentifier) {
            // call the controller
            return $.ajax(
                {
                    cache: false,
                    context: this,
                    dataType: "json",
                    success: this.fetchMarketingTokenSuccessHandler,
                    type: "GET",
                    xhrFields: { withCredentials: false },
                    headers: { },
                    data: {
                        deviceIdentifier: deviceIdentifier
                    },
                    url: _webApiUrl.substr(0, _webApiUrl.lastIndexOf('/') + 1) + "GetMarketingToken"
                }
            );    
        },

        fetchMarketingTokenSuccessHandler: function () {
            _tokenLoaded = true;
            this.fetchMarketingData();
        },

        targetedMarketingDataSuccessHandler: function (reply) {
            //var str = JSON.stringify(reply, null, 4); // (Optional) beautiful indented output.
            //console.info(str);  

            if (typeof reply === "undefined" || reply.length === 0) {
                return;
            } else {
                if (typeof reply.Containers !== "undefined") {
                    // we received a successful reply with containers
                    var data = {};

                    for (var x = 0; x < reply.Containers.length; x++) {
                        // Non Rotaters:
                        // set single images as non-rotators
                        // even if isRotator is true but only one image comes back, set as a non-rotator
                        if (reply.Containers[x].ContainerName.indexOf("MobileLandingPage_Slot_") !== -1 && ((reply.Containers[x].IsRotator === false && reply.Containers[x].Images.length > 0) ||
                                (reply.Containers[x].IsRotator === true && reply.Containers[x].Images.length === 1))) {
                            //get the current slot number:
                            var index = reply.Containers[x].ContainerName.substring(reply.Containers[x].ContainerName.lastIndexOf("_") + 1);
                            // fill up the data object with items:
                            data["mobile_landing_page_img_slot_" + index] = reply.Containers[x].Images[0].URL;
                            data["mobile_landing_page_href_slot_" + index] = reply.Containers[x].Images[0].OnClickAction;

                            // Rotators:
                        } else if (reply.Containers[x].ContainerName.indexOf("MobileLandingPage_Slot_") !== -1 && reply.Containers[x].IsRotator === true && reply.Containers[x].Images.length > 1) {
                            //get the current slot number:
                            var index = reply.Containers[x].ContainerName.substring(reply.Containers[x].ContainerName.lastIndexOf("_") + 1);

                            // fill up the data object with rotator arrays:
                            data["mobile_landing_page_img_slot_" + index] = [];
                            data["mobile_landing_page_href_slot_" + index] = [];

                            (function (x) {
                                for (var j = 0; j < reply.Containers[x].Images.length; j++) {
                                    data["mobile_landing_page_img_slot_" + index].push(reply.Containers[x].Images[j].URL);
                                    data["mobile_landing_page_href_slot_" + index].push(reply.Containers[x].Images[j].OnClickAction);
                                }
                            }(x));
                        }
                        // Target:
                        data["target_" + index] = reply.Containers[x].IsPopout === true ? "_blank" : "_self";
                    }
                } else if (typeof reply.containers !== "undefined") {
                    // lowercase JSON return:
                    var data = {};

                    for (var x = 0; x < reply.containers.length; x++) {
                        // Non Rotaters:
                        // set single images as non-rotators
                        // even if isRotator is true but only one image comes back, set as a non-rotator
                        if (reply.containers[x].containerName.indexOf("MobileLandingPage_Slot_") !== -1 && ((reply.containers[x].isRotator === false && reply.containers[x].images.length > 0) ||
                            (reply.containers[x].isRotator === true && reply.containers[x].images.length === 1))) {
                            //get the current slot number:
                            var index = reply.containers[x].containerName.substring(reply.containers[x].containerName.lastIndexOf("_") + 1);
                            // fill up the data object with items:
                            data["mobile_landing_page_img_slot_" + index] = reply.containers[x].images[0].url;
                            data["mobile_landing_page_href_slot_" + index] = reply.containers[x].images[0].onClickAction;

                            // Rotators:
                        } else if (reply.containers[x].containerName.indexOf("MobileLandingPage_Slot_") !== -1 && reply.containers[x].isRotator === true && reply.containers[x].images.length > 1) {
                            //get the current slot number:
                            var index = reply.containers[x].containerName.substring(reply.containers[x].containerName.lastIndexOf("_") + 1);

                            // fill up the data object with rotator arrays:
                            data["mobile_landing_page_img_slot_" + index] = [];
                            data["mobile_landing_page_href_slot_" + index] = [];

                            (function (x) {
                                for (var j = 0; j < reply.containers[x].images.length; j++) {
                                    data["mobile_landing_page_img_slot_" + index].push(reply.containers[x].images[j].url);
                                    data["mobile_landing_page_href_slot_" + index].push(reply.containers[x].images[j].onClickAction);
                                }
                            }(x));
                        }
                        // Target:
                        data["target_" + index] = reply.containers[x].isPopout === true ? "_blank" : "_self";
                    }
                } else {
                    return;
                }

                console.log("data = ", data);

                for (var i = 1; i < 40; i++) {
                    // populate images:
                    if (typeof data['mobile_landing_page_img_slot_' + i] === "string" && !this.stringIsNullOrEmpty(data['mobile_landing_page_img_slot_' + i])) {
                        // this is an attempt to make sure that the image even exists at the URL. If not, show a placeholder image instead                       
                        $.get(data['mobile_landing_page_img_slot_' + i])
                            .done(function (j) {
                                return function () {
                                    $("#mobile_landing_page_img_slot_" + j).prop("src", data['mobile_landing_page_img_slot_' + j]);
                                };
                            }(i)).fail(function(k) {
                                return function () {
                                    $("#mobile_landing_page_img_slot_" + k).prop("src", "assets/img/placeholder.png");
                                    $("#mobile_landing_page_img_slot_" + k).prop("style", "opacity:0.0;");
                                };
                            }(i));

                        // populate hrefs:
                        if (typeof data['mobile_landing_page_href_slot_' + i] === "string" && !this.stringIsNullOrEmpty(data['mobile_landing_page_href_slot_' + i])
                            && data['mobile_landing_page_href_slot_' + i] !== null && data['mobile_landing_page_href_slot_' + i] !== "void();") {
                            $("#mobile_landing_page_href_slot_" + i).prop("href", data['mobile_landing_page_href_slot_' + i]);
                            $("#mobile_landing_page_href_slot_" + i).prop("target", data["target_" + i]);
                        } else {
                            $("#mobile_landing_page_href_slot_" + i).prop("href", "#");
                            $("#mobile_landing_page_href_slot_" + i).prop("target", "_self");
                        }
                    } else if (Object.prototype.toString.call(data['mobile_landing_page_img_slot_' + i]) === '[object Array]' && data['mobile_landing_page_img_slot_' + i].length > 1 &&
                        Object.prototype.toString.call(data['mobile_landing_page_href_slot_' + i]) === '[object Array]' && data['mobile_landing_page_href_slot_' + i].length > 1) {
                        // populate slot immediately with first image in the array:
                        document.getElementById("mobile_landing_page_img_slot_" + i).src = data["mobile_landing_page_img_slot_" + i][0];

                        // populate hrefs. checking first one for validity: it's a string, not null or empty, not null and the href isn't "void();"
                        if (typeof data['mobile_landing_page_href_slot_' + i][0] === "string" && !this.stringIsNullOrEmpty(data['mobile_landing_page_href_slot_' + i][0])
                                && data["mobile_landing_page_href_slot_" + i][0] !== null && data["mobile_landing_page_href_slot_" + i][0] !== "void();") {
                            document.getElementById("mobile_landing_page_href_slot_" + i).href = data["mobile_landing_page_href_slot_" + i][0];
                            document.getElementById("mobile_landing_page_href_slot_" + i).target = data["target_" + i];
                        } else {    // set a default "#" href and '_self' target for the image:
                            document.getElementById("mobile_landing_page_href_slot_" + i).href = "#";
                            document.getElementById("mobile_landing_page_href_slot_" + i).target = "_self";
                        }

                        // call the build rotator function in the module:
                        this.buildSlotRotator(i, data['mobile_landing_page_img_slot_' + i], data["mobile_landing_page_href_slot_" + i], data["target_" + i], true);
                    }       
                }
            }
        },

        targetedMarketingDataFailureHandler: function () {
            console.info("Got here: targetedMarketingDataFailureHandler");   // fail silently
        },

        setSlotNumbers: function (slots) {
            _imageSlots = slots;
            // console.info("_imageSlots = " + slots)
        },

        stringIsNullOrEmpty: function (sString) {
            return (typeof sString === "undefined" || sString === null || sString.length === 0);
        },

        getParameterByName(name, url) {
            if (!url) {
                url = window.location.href;
            }
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        },

        buildSlotRotator(slotNumber, images, hrefs, target, firstTime) {
            // If there isn't an index object for this slot number, build one
            if (!_currIndex[slotNumber]) {
                _currIndex[slotNumber] = 0; 
            }

            // don't count up if this is the first time after page load
            if (firstTime === false) {
                _currIndex[slotNumber]++;
            }

            // reset counter when at the last image:
            if (_currIndex[slotNumber] === images.length) { _currIndex[slotNumber] = 0; }

            if (firstTime === false) {
                // add the fadeout class for the fading effect. this class must exist in the css file for this document in order to work
                document.getElementById("mobile_landing_page_img_slot_" + slotNumber).className += " fadeOut";

                // rotate the image to the next one in the array. remove the "fadeout" class name so the new image can appear:
                setTimeout(function () {
                    // change image:
                    document.getElementById("mobile_landing_page_img_slot_" + slotNumber).src = images[_currIndex[slotNumber]];

                    // change href if it is valid:
                    if (typeof hrefs[_currIndex[slotNumber]] !== "undefined" && hrefs[_currIndex[slotNumber]] !== null
                                && typeof hrefs[_currIndex[slotNumber]] === "string" && hrefs[_currIndex[slotNumber]].length > 0
                                && hrefs[_currIndex[slotNumber]].toLowerCase() !== "void();") {
                        document.getElementById("mobile_landing_page_href_slot_" + slotNumber).href = hrefs[_currIndex[slotNumber]];
                        document.getElementById("mobile_landing_page_href_slot_" + slotNumber).target = target;
                    } else {
                        document.getElementById("mobile_landing_page_href_slot_" + slotNumber).href = "#";
                        document.getElementById("mobile_landing_page_href_slot_" + slotNumber).target = "_self";

                    }
                    var currClassName = document.getElementById("mobile_landing_page_img_slot_" + slotNumber).className;
                    var newClassName = currClassName.substring(0, currClassName.length - 8);

                    document.getElementById("mobile_landing_page_img_slot_" + slotNumber).className = newClassName;
                }, _fadeDuration);    // this number must match the duration property in the css, or it will fade in and out funny
            }

            setTimeout(function () {
                TargetedMarketing.prototype.buildSlotRotator(slotNumber, images, hrefs, target, false);
            }, _imgDuration);
        }
  
    }; // end prototype.

    TargetedMarketing.init = function () {
        var self = this;
    };

    TargetedMarketing.init.prototype = TargetedMarketing.prototype;

    global.TargetedMarketing = global.tm$ = TargetedMarketing;


}(window, jQuery));

