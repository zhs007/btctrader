"use strict";

const { HTMLOutput } = require('./htmloutput');
const fs = require('fs');

const HTML_START = '<!DOCTYPE html>\n' +
    '<html style="height: 100%">\n' +
    '<head>\n' +
    '    <meta charset="utf-8">\n' +
    '</head>\n' +
    '<body style="height: 100%; margin: 0">\n' +
    '<div id="container" style="height: 100%"></div>\n' +
    '<script type="text/javascript" src="http://echarts.baidu.com/gallery/vendors/echarts/echarts.min.js"></script>\n' +
    '<script type="text/javascript" src="http://echarts.baidu.com/gallery/vendors/echarts-gl/echarts-gl.min.js"></script>\n' +
    '<script type="text/javascript" src="http://echarts.baidu.com/gallery/vendors/echarts-stat/ecStat.min.js"></script>\n' +
    '<script type="text/javascript" src="http://echarts.baidu.com/gallery/vendors/echarts/extension/dataTool.min.js"></script>\n' +
    '<script type="text/javascript" src="http://echarts.baidu.com/gallery/vendors/echarts/map/js/china.js"></script>\n' +
    '<script type="text/javascript" src="http://echarts.baidu.com/gallery/vendors/echarts/map/js/world.js"></script>\n' +
    '<script type="text/javascript" src="http://api.map.baidu.com/api?v=2.0&ak=ZUONbpqGBsYGXNIYHicvbAbM"></script>\n' +
    '<script type="text/javascript" src="http://echarts.baidu.com/gallery/vendors/echarts/extension/bmap.min.js"></script>\n' +
    '<script type="text/javascript" src="http://echarts.baidu.com/gallery/vendors/simplex.js"></script>\n' +
    '<script type="text/javascript">\n' +
    '    var dom = document.getElementById("container");\n' +
    '    var myChart = echarts.init(dom);\n' +
    '    var app = {};\n' +
    '    var option = null;\n';

const HTML_END = '    if (option && typeof option === "object") {\n' +
    '        myChart.setOption(option, true);\n' +
    '    }\n' +
    '</script>\n' +
    '</body>\n' +
    '</html>';

const HTML_LINE_OPTION = '    option = {\n' +
    '        tooltip: {\n' +
    '            trigger: \'axis\',\n' +
    '            position: function (pt) {\n' +
    '                return [pt[0], \'10%\'];\n' +
    '            }\n' +
    '        },\n' +
    '        title: {\n' +
    '            left: \'center\',\n' +
    '            text: \'大数据量面积图\',\n' +
    '        },\n' +
    '        toolbox: {\n' +
    '            feature: {\n' +
    '                dataZoom: {\n' +
    '                    yAxisIndex: \'none\'\n' +
    '                },\n' +
    '                restore: {},\n' +
    '                saveAsImage: {}\n' +
    '            }\n' +
    '        },\n' +
    '        xAxis: {\n' +
    '            type: \'category\',\n' +
    '            boundaryGap: false,\n' +
    '            data: date\n' +
    '        },\n' +
    '        yAxis: {\n' +
    '            type: \'value\',\n' +
    '            boundaryGap: [0, \'100%\'],\n' +
    '            min: "dataMin"' +
    '        },\n' +
    '        dataZoom: [{\n' +
    '            type: \'inside\',\n' +
    '            start: 0,\n' +
    '            end: 10\n' +
    '        }, {\n' +
    '            start: 0,\n' +
    '            end: 10,\n' +
    '            handleIcon: \'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z\',\n' +
    '            handleSize: \'80%\',\n' +
    '            handleStyle: {\n' +
    '                color: \'#fff\',\n' +
    '                shadowBlur: 3,\n' +
    '                shadowColor: \'rgba(0, 0, 0, 0.6)\',\n' +
    '                shadowOffsetX: 2,\n' +
    '                shadowOffsetY: 2\n' +
    '            }\n' +
    '        }],\n' +
    '        series: [\n' +
    '            {\n' +
    '                name:\'模拟数据\',\n' +
    '                type:\'line\',\n' +
    '                smooth:true,\n' +
    '                symbol: \'none\',\n' +
    '                data: data\n' +
    '            }\n' +
    '        ]\n' +
    '    };';

class HTMLOutput_ECharts extends HTMLOutput {
    constructor() {
        super();
    }

    outputLine(arr, htmlname) {
        let strdate = 'var date = [';
        let strdata = 'var data = [';

        for (let i = 0; i < arr.length; ++i) {
            let cn = arr[i];
            strdate += '"';
            strdate += new Date(cn.tsms).toISOString();
            strdate += '"';

            strdata += cn.price;

            if (i < arr.length - 1) {
                strdata += ', ';
                strdate += ', ';
            }
            else {
                strdata += ']\n';
                strdate += ']\n';
            }
        }

        fs.writeFileSync(htmlname, HTML_START + strdate + strdata + HTML_LINE_OPTION + HTML_END, 'utf-8');
    }
};

HTMLOutput_ECharts.singleton = new HTMLOutput_ECharts();

exports.HTMLOutput_ECharts = HTMLOutput_ECharts;