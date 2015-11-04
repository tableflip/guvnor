var View = require('ampersand-view')
var templates = require('../../templates')
var Highcharts = require('highcharts-browserify')

module.exports = View.extend({
  template: templates.includes.graph,
  render: function () {
    this.renderWithTemplate(this)

    setTimeout(this.renderGraph.bind(this), 100)
  },
  renderGraph: function () {
    var memoryUsage = this.query('[data-hook=graph]')

    var fontStyle = {
      fontFamily: '"RobotoDraft", "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: 'normal',
      color: 'rgba(0, 0, 0, 0.84)'
    }

    new Highcharts.Chart({
      chart: {
        type: 'column',
        renderTo: memoryUsage,
        spacing: [0, 0, 5, 0],
        backgroundColor: 'rgba(0, 0, 0, 0)'
      },
      title: {
        text: 'Memory',
        style: fontStyle
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
      xAxis: {
        title: {
          text: null
        },
        labels: {
          enabled: false
        },
        tickLength: 0,
        lineColor: '#444'
      },
      yAxis: {
        min: 0,
        max: 100,
        gridLineColor: 'transparent',
        title: {
          text: null
        },
        labels: {
          enabled: false
        }
      },
      credits: {
        enabled: false
      },
      tooltip: {
        enabled: false
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: false
          },
          borderColor: '#222'
        }
      },
      series: [{
        name: 'Memory',
        data: this.model.usedMemory
      }]
    })
  },
  bindings: {
    'model.usedMemory': {
      type: function (el, usedMemory) {
        if (!usedMemory) {
          return
        }

        var chart = Highcharts.charts[el.getAttribute('data-highcharts-chart')]

        if (!chart) {
          return
        }

        var point = chart.series[0].points[0]

        if (!point) {
          return
        }

        point.update(usedMemory)
      },
      hook: 'graph'
    }
  }
})
