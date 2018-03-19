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

const HTML_LINE2_OPTION = '    option = {\n' +
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
    '            },\n' +
    '            {\n' +
    '                name:\'模拟数据1\',\n' +
    '                type:\'line\',\n' +
    '                smooth:true,\n' +
    '                symbol: \'none\',\n' +
    '                data: data1\n' +
    '            }\n' +
    '        ]\n' +
    '    };';

const HTML_LINE3_OPTION = '    option = {\n' +
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
    '            },\n' +
    '            {\n' +
    '                name:\'模拟数据1\',\n' +
    '                type:\'line\',\n' +
    '                smooth:true,\n' +
    '                symbol: \'none\',\n' +
    '                data: data1\n' +
    '            },\n' +
    '            {\n' +
    '                name:\'模拟数据2\',\n' +
    '                type:\'line\',\n' +
    '                smooth:true,\n' +
    '                symbol: \'none\',\n' +
    '                data: data2\n' +
    '            }\n' +
    '        ]\n' +
    '    };';

const HTML_LINE4_OPTION = '    option = {\n' +
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
    '            },\n' +
    '            {\n' +
    '                name:\'模拟数据1\',\n' +
    '                type:\'line\',\n' +
    '                smooth:true,\n' +
    '                symbol: \'none\',\n' +
    '                data: data1\n' +
    '            },\n' +
    '            {\n' +
    '                name:\'模拟数据2\',\n' +
    '                type:\'line\',\n' +
    '                smooth:true,\n' +
    '                symbol: \'none\',\n' +
    '                data: data2\n' +
    '            },\n' +
    '            {\n' +
    '                name:\'模拟数据3\',\n' +
    '                type:\'line\',\n' +
    '                smooth:true,\n' +
    '                symbol: \'none\',\n' +
    '                data: data3\n' +
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
        let strdata1 = 'var data1 = [';
        let strdata2 = 'var data2 = [';
        let strdata3 = 'var data3 = [';

        let bp = arr[0].price;
        let lp = arr[0].price;
        let maxv = 0;

        for (let i = 0; i < arr.length; ++i) {
            if (maxv < arr[i].volume) {
                maxv = arr[i].volume;
            }
        }

        let lbp = arr[0].price;
        let lsp = arr[0].price;

        for (let i = 0; i < arr.length; ++i) {
            let cn = arr[i];
            strdate += '"';
            strdate += new Date(cn.tsms).toISOString();
            strdate += '"';

            if (cn.volume >= 0.01) {
                if (cn.type == 1) {
                    strdata += (cn.price - bp) / bp;
                    strdata3 += (lsp - bp) / bp;

                    lbp = cn.price;
                }
                else {
                    strdata += (lbp - bp) / bp;
                    strdata3 += (cn.price - bp) / bp;

                    lsp = cn.price;
                }
            }
            else {
                strdata += (lbp - bp) / bp;
                strdata3 += (lsp - bp) / bp;
            }

            strdata1 += (cn.price - lp) / lp;
            strdata2 += (cn.askprice - cn.bidprice) / lp;
            // strdata3 += (cn.volume) / maxv * 0.1;

            if (i < arr.length - 1) {
                strdate += ', ';
                strdata += ', ';
                strdata1 += ', ';
                strdata2 += ', ';
                strdata3 += ', ';
            }
            else {
                strdate += ']\n';
                strdata += ']\n';
                strdata1 += ']\n';
                strdata2 += ']\n';
                strdata3 += ']\n';
            }

            lp = cn.price;
        }

        fs.writeFileSync(htmlname, HTML_START + strdate + strdata + strdata1 + strdata2 + strdata3 + HTML_LINE4_OPTION + HTML_END, 'utf-8');
    }
};

HTMLOutput_ECharts.singleton = new HTMLOutput_ECharts();

exports.HTMLOutput_ECharts = HTMLOutput_ECharts;