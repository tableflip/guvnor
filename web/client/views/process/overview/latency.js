var View = require('ampersand-view'),
  templates = require('../../../templates'),
  config = require('clientconfig')

module.exports = View.extend({
  template: templates.includes.process.overview.latency,
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
        "rgba(223, 83, 83, 0.8)"
      ],
      chart: {
        type: "areaspline",
        renderTo: this.query('[data-hook=latency-usage]'),
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: '#444',
        events: {
          load: function() {
            this.query('[data-hook=latency-usage] .highcharts-container').style.width = '100%'

            setTimeout(function() {
              $(window).resize()
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
        type: "datetime",
        labels: {
          overflow: "justify",
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
          formatter: function() {
            return this.value + ' ms'
          },
          style: fontStyle
        },
        gridLineColor: lineColour,
        min: 0
      },
      tooltip: {
        enabled: true,
        formatter: function() {
          var s = [];

          window.$.each(this.points, function(i, point) {
            s.push('<span style="color:' + point.series.color + '">' + point.series.name + '</span>: ' + this.y.toFixed(2) + ' ms');
          });

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
        name: "Latency",
        data: this.model.latency
      }]
    })

    this.listenTo(this.model, 'update', function() {
      this._chart.series[0].setData(this.model.latency, false)
      this._chart.redraw()
    }.bind(this))
  },
  remove: function() {
    View.prototype.remove.call(this)

    if(this._chart) {
      this._chart.destroy()
      this._chart = null
    }
  }
})
