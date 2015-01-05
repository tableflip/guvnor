var View = require('ampersand-view'),
  templates = require('../../../templates')

module.exports = View.extend({
  template: templates.includes.process.overview.cpu,
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
        type: "areaspline",
        renderTo: this.query('[data-hook=cpu-usage]'),
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: '#444',
        events: {
          load: function() {
            this.query('.highcharts-container').style.width = '100%'
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
          format: '{value} %',
          style: fontStyle
        },
        min: 0,
        max: 100,
        gridLineColor: lineColour
      },
      tooltip: {
        enabled: true,
        formatter: function() {
         return '<span style="color:' + this.series.color + '">'+ this.series.name +'</span>: ' + this.y + ' %'
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
          fillOpacity: 0.1
        }
      },
      series: [{
        name: "CPU",
        data: this.model.cpu.map(function(value) {
          return [value.date, value.usage]
        })
      }]
    })

    this.listenTo(this.model.cpu, 'add', function(value) {
      this._chart.series[0].addPoint([value.date, value.usage])
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
