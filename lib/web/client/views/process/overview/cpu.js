var View = require('ampersand-view')
var config = require('clientconfig')
var HighCharts = require('highcharts-browserify')
var colours = require('./colours')
var debouncedUpdate = require('./debounced-update')

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

    this._chart = new HighCharts.Chart({
      chart: {
        type: 'areaspline',
        renderTo: this.query('[data-hook=cpu-usage]'),
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: '#444',
        events: {
          load: function () {
            setTimeout(function () {
              this._chart.reflow()
            }.bind(this), 10)
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
      series: []
    })

    debouncedUpdate(this, function () {
      var series = [{
        name: 'Master',
        data: this.model.master.cpuHistory,
        color: colours[0]
      }]

      this.model.workers.forEach(function (worker, index) {
        series.push({
          name: 'Worker ' + worker.pid,
          data: worker.cpuHistory,
          color: colours[index + 1]
        })
      })

      this._chart.series.forEach(function (series) {
        series.remove(false)
      })

      series.forEach(function (series) {
        this._chart.addSeries(series, false)
      }.bind(this))

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
