var express = require('express');
var router = express.Router();

var moment = require('moment');
var GS1 = require('gs1-parser')

var urlQuery = require('../lib/barcodeParseUrlQuery');

/* GET home page. */
router.get('/', function (req, res, next) {
    var urlQueryObj = urlQuery.buildUrlQueryObj(req.url);
    var barcode = urlQueryObj.barcode ;
    if (barcode != undefined)
        barcode = barcode.replace(/\(/g, '').replace(/\)/g, '').replace(/（/g, '').replace(/）/g, '');

    //HIBC 条形码开始字符“+”在 url 编码规则中会被解读为空格，所以如果要传入“+”,则要使用+的转义字符“%2b”
    //如:http://localhost:8888/?barcode=%2b$$09053C001%20C, 而不是能 http://localhost:8888/?barcode=+$$09053C001%20C
    var barcodeObj = { error: null };
    try {
        barcodeObj = GS1.decode(barcode);
    } catch(e) {
        if (e.num == 5 || e.num == 6) {
            //对不是标准的 GS1码,暂时直接返回整个条码,不作解析
            barcodeObj.GTIN = barcode;
        } else {
            if (e.num === undefined)
                barcodeObj.error = e;
            else {
                barcodeObj.error = e.num;
                barcodeObj.errorobj = e;
            }
        }
    }

    var renderedObj = {
        key: urlQueryObj.key,
        session: urlQueryObj.session,
        title: urlQueryObj.key + '条形码解析器',
        barcode: barcode
    };

    if (barcodeObj.safeDate) {
        barcodeObj.safeDate = moment(barcodeObj.safeDate, 'yyyy-MM-dd');
    }
    for (var key in barcodeObj) {
        renderedObj[key] = barcodeObj[key];
    }

    res.render(
        'parseBarcodeRet', renderedObj
    );
});

module.exports = router;
