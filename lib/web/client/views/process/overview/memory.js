var View = require('ampersand-view')
var prettysize = require('prettysize')
var config = require('clientconfig')
var $ = require('jquery')
var HighCharts = require('highcharts-browserify')
var debouncedUpdate = require('./debounced-update')
var Colour = require('color')
var colours = require('./colours')

module.exports = View.extend({
  template: require('./memory.hbs'),
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
        renderTo: this.query('[data-hook=memory-usage]'),
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

          $.each(this.points, function (i, point) {
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
      series: []
    })

    debouncedUpdate(this, function () {
      var series = [{
        name: 'Master Heap used',
        data: this.model.master.heapUsedHistory,
        color: Colour(colours[0]).rgbString()
      }, {
        name: 'Master Heap size',
        data: this.model.master.heapTotalHistory,
        color: Colour(colours[0]).darken(0.2).rgbString()
      }, {
        name: 'Master Resident set size',
        data: this.model.master.residentSizeHistory,
        color: Colour(colours[0]).darken(0.4).rgbString()
      }]

      this.model.workers.forEach(function (worker, index) {
        series.push({
          name: 'Worker ' + worker.pid + ' Heap used',
          data: worker.heapUsedHistory,
          color: Colour(colours[index + 1]).rgbString()
        }, {
          name: 'Worker ' + worker.pid + ' Heap size',
          data: worker.heapTotalHistory,
          color: Colour(colours[index + 1]).darken(0.2).rgbString()
        }, {
          name: 'Worker ' + worker.pid + ' Resident set size',
          data: worker.residentSizeHistory,
          color: Colour(colours[index + 1]).darken(0.4).rgbString()
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
