var View = require('ampersand-view')
var config = require('clientconfig')

module.exports = View.extend({
  template: require('./cpu.hbs'),
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
      chart: {
        type: 'areaspline',
        renderTo: this.query('[data-hook=cpu-usage]'),
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: '#444',
        events: {
          load: function () {
            this.query('.highcharts-container').style.width = '100%'

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
        enabled: false
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
          format: '{value} %',
          style: fontStyle
        },
        min: 0,
        max: 100,
        gridLineColor: lineColour
      },
      tooltip: {
        enabled: true,
        formatter: function () {
          return '<span style="color:' + this.series.color + '">' + this.series.name + '</span>: ' + this.y.toFixed(2) + ' %'
        },
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
        name: 'CPU',
        data: this.model.cpu
      }]
    })

    this.listenTo(this.model, 'update', function () {
      var last = 0

      this.model.cpu.forEach(function (cpu, index) {
        if (cpu.x > last) {
          last = cpu.x
        } else {
          console.error('cpu index', index, 'of', this.model.cpu.length, 'not sorted')
        }
      }.bind(this))

      this._chart.series[0].setData(this.model.cpu, false)
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
