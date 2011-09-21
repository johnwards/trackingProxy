
exports.hide_iframes = function(content) {
    var r = /<iframe(.*?)>/ig;
    content = content.replace(r,function(){
        console.log("hiding an iframe");
        return "<style>.xxxHideIframe {display:none;}</style><iframe "+arguments[1]+" class='xxxHideIframe' >";
    });
    return content;
}

exports.add_address_bar = function(content, address) {
    var r = /<body.*?>/ig;
    content = content.replace(r, function(){
        var search_bar = "" +
                "<script> " +
                    "function xxxTransformAddressClick(){" +
                        "var url = document.xxxTransformAddressForm.xxxTransformAddressFormAddress.value;" +
                        "if(url.length < 2) return false;" +
                        "if(url.match(/http:\\/\\//))" +
                        "    {" +
                        "        url = url.substring(7);" +
                        "    }" +
                        "if(!url.match(/\\//)) {" +
                        "   url += \"/\"" +
                        "}" +
                        "var new_url = document.location.host + \"/\" + url;" +
                        "document.location = \"http://\" + new_url; " +
                        "return false;" +
                    "}" +
                "</script>" +
                "<style> #xxxTransformAddressFormButton:hover{background: #0071A3}</style>" +
                "<div style='border-bottom: 2px solid #888888; text-align:center; width:100%; position: fixed; bottom:0; z-index: 1000000; background-image: linear-gradient(bottom, rgb(191,191,191) 7%, rgb(217,217,217) 43%, rgb(242,242,242) 79%); background-image: -o-linear-gradient(bottom, rgb(191,191,191) 7%, rgb(217,217,217) 43%, rgb(242,242,242) 79%); background-image: -moz-linear-gradient(bottom, rgb(191,191,191) 7%, rgb(217,217,217) 43%, rgb(242,242,242) 79%);  background-image: -webkit-linear-gradient(bottom, rgb(191,191,191) 7%, rgb(217,217,217) 43%, rgb(242,242,242) 79%); background-image: -ms-linear-gradient(bottom, rgb(191,191,191) 7%, rgb(217,217,217) 43%, rgb(242,242,242) 79%);  background-image: -webkit-gradient(linear, left bottom, left top, color-stop(0.07, rgb(191,191,191)), color-stop(0.43, rgb(217,217,217)), color-stop(0.79, rgb(242,242,242)) );'>" +
                    "<div style='width:992px; margin: auto; '>" +
                        "<div style='font-family: Helvetica,Arial,sans-serif; font-size: 13px; font-weight: bold; padding-left: 10px; padding-top: 7px; text-align: left; color:#676767;'>ENGAUGE</div>" +
                        "<form name='xxxTransformAddressForm'>" +
                        "<label style='font-size: 13px; font-family: Helvetica,Arial,sans-serif;'>http://</label>" +
                        "<input type='text' value='"+address+"' name='xxxTransformAddressFormAddress' style='padding:5px; width: 870px; margin:10px 10px 10px 3px;border: 1px solid #999999; font-size: 13px; font-family: Helvetica,Arial,sans-serif;'>" +
                        "<button id='xxxTransformAddressFormButton'" +
                        "onClick='xxxTransformAddressClick(); return false;' " +
                        "type='submit' style='border:none; background: #00A9D9 ; display: inline-block; padding: 5px 5px 5px; vertical-align: top; margin-top:9px; color: #fff; text-decoration: none; -moz-border-radius: 5px; -webkit-border-radius: 5px; text-shadow: 0 -1px 1px rgba(0,0,0,0.25); border-bottom: 1px solid rgba(0,0,0,0.25); position: relative; font-size:15px; font-weight:bold; font-family: Helvetica,Arial,sans-serif;'>Go</button></form>" +
                    "</div>" +
                "</div>";
        
        console.log(arguments[0]+search_bar);
        return arguments[0]+search_bar;
    });
    return content;
}

/**
 * A direct port of:
 * http://code.google.com/p/mirrorrr/source/browse/trunk/transform_content.py
 *
 * @author Brett Slatkin
 * @author John Wards
 * @licence http://www.apache.org/licenses/LICENSE-2.0
 * @param base_url
 * @param accessed_url
 * @param content
 */
exports.transform_content = function(base_url, accessed_url, content) {
    // URLs that have absolute addresses
    // {url} 1
    this.ABSOLUTE_URL_REGEX = "(http(s?):)?//([^\\\"'> \\t\\)]+)";

    // URLs that are relative to the base of the current hostname.
    // {url} 3
    this.BASE_RELATIVE_URL_REGEX = "/(?!(/)|(http(s?)://)|(url[\\(]))([^\\\"'> \\t\\)]*)";

    // URLs that have '../' or './' to start off their paths.
    // {relative} 0, {url} 4
    this.TRAVERSAL_URL_REGEX = "(\\.(\\.)?)/(?!(/)|(http(s?)://)|(url[\\(]))([^\\\"'> \\t\\)]*)";

    // URLs that are in the same directory as the requested URL.
    // url is at position 3
    this.SAME_DIR_URL_REGEX = "(?!(/)|(http(s?)://)|(url[\\(]))([^\\\"'> \\t\\)]+)";


    // URL matches the root directory.
    // url is at position 1
    this.ROOT_DIR_URL_REGEX = "(?!//(?!>))/()(?=[ \\t\\n]*[\"'\\)>/])";

    // Start of a tag using 'src' or 'href'
    //Catches {tag} 0, {equals} 1, then {quote} 2
    this.TAG_START = "(\\s|\"|')(src|href|action|url|background)([\\t ]*=[\\t ]*)([\\\"']?)";

    // Start of a CSS import
    // <spacing> 0, {quote} 1
    this.CSS_IMPORT_START = "@import([\\t ]+)([\\\"']?)";

    // CSS url() call
    // {quote} 0
    this.CSS_URL_START = "\\burl[\\(]([\\\"']?)";

    this.REPLACEMENT_REGEXES = [
      [     this.TAG_START + this.SAME_DIR_URL_REGEX,
            "{start}{tag}{equals}{quote}{accessed_dir}{url}",
            {"start":1, "tag":2, "equals":3, "quote":4, "url":9 }
      ],

      [     this.TAG_START + this.TRAVERSAL_URL_REGEX,
            "{start}{tag}{equals}{quote}{accessed_dir}/{relative}/{url}",
            {"start":1, "tag":2, "equals":3, "quote":4, "url":9 }
      ],

      [     this.TAG_START + this.BASE_RELATIVE_URL_REGEX,
            "{start}{tag}{equals}{quote}/{base}/{url}",
            {"start":1, "tag":2, "equals":3, "quote":4, "url":9 }
      ],

      [     this.TAG_START + this.ROOT_DIR_URL_REGEX,
            "{start}{tag}{equals}{quote}/{base}/",
            {"start":1, "tag":2, "equals":3, "quote":4, "url":9 }
      ],

      // Need this because HTML tags could end with '/>', which confuses the
      // tag-matching regex above, since that's the end-of-match signal.
      [     this.TAG_START + this.ABSOLUTE_URL_REGEX,
            "{start}{tag}{equals}{quote}/{url}",
            {"start":1, "tag":2, "equals":3, "quote":4, "url":7 }
      ],

      [this.CSS_IMPORT_START + this.SAME_DIR_URL_REGEX,
         "@import{spacing}{quote}{accessed_dir}{url}"],

      [this.CSS_IMPORT_START + this.TRAVERSAL_URL_REGEX,
         "@import{spacing}{quote}{accessed_dir}/{relative}/{url}"],

      [this.CSS_IMPORT_START + this.BASE_RELATIVE_URL_REGEX,
         "@import{spacing}{quote}/{base}/{url}"],

      [this.CSS_IMPORT_START + this.ABSOLUTE_URL_REGEX,
         "@import{spacing}{quote}/{url}"],

      [this.CSS_URL_START + this.SAME_DIR_URL_REGEX,
         "url({quote}{accessed_dir}{url}",
         {"quote":1, "url":6 }
      ],

      [this.CSS_URL_START + this.TRAVERSAL_URL_REGEX,
          "url({quote}{accessed_dir}/{relative}/{url}",
            {"quote":1, "url":6 }],

      [this.CSS_URL_START + this.BASE_RELATIVE_URL_REGEX,
          "url({quote}/{base}/{url}",
          {"quote":1, "url":6 }
      ],

      [this.CSS_URL_START + this.ABSOLUTE_URL_REGEX,
          " url({quote}/{url}",
            {"quote":1, "url":4 }
      ]
    ]
    /**
      def TransformContent(base_url, accessed_url, content):
      url_obj = urlparse.urlparse(accessed_url)
      accessed_dir = os.path.dirname(url_obj.path)
      if not accessed_dir.endswith("/"):
        accessed_dir += "/"

      for pattern, replacement in REPLACEMENT_REGEXES:
        fixed_replacement = replacement % {
          "base": base_url,
          "accessed_dir": accessed_dir,
        }
        content = re.sub(pattern, fixed_replacement, content)
      return content
     */

    for (var i = 0; i<this.REPLACEMENT_REGEXES.length; i++) {
        var pattern = this.REPLACEMENT_REGEXES[i][0];
        var replacement = this.REPLACEMENT_REGEXES[i][1];
        if(this.REPLACEMENT_REGEXES[i][2]) {
            var replacement_pos = this.REPLACEMENT_REGEXES[i][2];
        }
        else var replacement_pos = undefined;
        //var fixed_repacement = replacement.supplant({base: "http://localhost:3000/", accessed_dir: "/"});

        content = content.replace(new RegExp(pattern, "ig"), function(){
            if(replacement_pos != undefined){
                //console.log("match "+i);
                //console.log(arguments);
                //if(i == 9) console.log(arguments);
                //if(arguments[replacement_pos["url"]]==undefined) console.log(arguments);
                var the_replacement = replacement.supplant({base: base_url, accessed_dir: "/", url: arguments[replacement_pos["url"]], start: arguments[replacement_pos["start"]], tag: arguments[replacement_pos["tag"]], equals: arguments[replacement_pos["equals"]], quote: arguments[replacement_pos["quote"]]});
                //console.log(the_replacement);
                return the_replacement;
            }
            //console.log(arguments)
        });
    }

    return content;
}

