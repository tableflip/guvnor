var View = require('ampersand-view')
var templates = require('../../../templates')
var prettysize = require('prettysize')
var config = require('clientconfig')

module.exports = View.extend({
  template: templates.includes.process.overview.memory,
  render: function () {
    this.renderWithTemplate(this)

    var fontStyle = {
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '14px',
      fontWeight: 'normal',
      color: '#BDBDBD'
    }
    var lineColour = '#444'

    this._chart = new window.Highcharts.Chart({
      colors: [
        'rgba(245, 255, 92, 0.8)',
        'rgba(0, 255, 0, 0.8)',
        'rgba(42, 159, 214, 0.8)'
      ],
      chart: {
        type: 'areaspline',
        renderTo: this.query('[data-hook=memory-usage]'),
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: '#444',
        events: {
          load: function () {
            this.query('[data-hook=memory-usage] .highcharts-container').style.width = '100%'

            setTimeout(function () {
              window.$(window).resize()
            }, 10)
          }.bind(this)
        }
      },
      title: {
        text: null
      },
      legend: {
        itemStyle: fontStyle,
        itemHiddenStyle: {
          color: '#444'
        },
        itemHoverStyle: {
          color: '#777'
        }
      },
      credits: {
        enabled: false
      },
      exporting: {
        enabled: false
      },
      xAxis: {
        type: 'datetime',
        labels: {
          overflow: 'justify',
          y: 25,
          style: fontStyle
        },
        gridLineColor: lineColour,
        gridLineWidth: 1
      },
      yAxis: {
        title: {
          text: null
        },
        labels: {
          formatter: function () {
            return prettysize(this.value)
          },
          style: fontStyle
        },
        gridLineColor: lineColour
      },
      tooltip: {
        enabled: true,
        formatter: function () {
          var s = []

          window.$.each(this.points, function (i, point) {
            s.push('<span style="color:' + point.series.color + '">' + point.series.name + '</span>: ' + prettysize(this.y))
          })

          return s.join('<br/>')
        },
        shared: true,
        backgroundColor: '#333',
        borderColor: '#666',
        style: {
          color: '#FFF'
        }
      },
      plotOptions: {
        areaspline: {
          lineWidth: 4,
          states: {
            hover: {
              lineWidth: 5
            }
          },
          // disabled markers until data interpolation is supported
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: false
              }
            }
          },
          fillOpacity: 0
        },
        series: {
          turboThreshold: config.dataPoints
        }
      },
      series: [{
        name: 'Heap used',
        data: this.model.heapUsed
        }, {
        name: 'Heap size',
        data: this.model.heapTotal
        }, {
        name: 'Resident set size',
        data: this.model.residentSize
        }
      ]
    })

    this.listenTo(this.model, 'update', function () {
      this._chart.series[0].setData(this.model.heapUsed, false)
      this._chart.series[1].setData(this.model.heapTotal, false)
      this._chart.series[2].setData(this.model.residentSize, false)
      this._chart.redraw()
    }.bind(this))
  },
  remove: function () {
    View.prototype.remove.call(this)

    if (this._chart) {
      this._chart.destroy()
      this._chart = null
    }
  }
})
