var View = require('ampersand-view')
var templates = require('../../templates')
var Highcharts = require('highcharts-browserify')
require('highcharts-browserify/themes/dark-blue')

module.exports = View.extend({
  template: templates.includes.graph,
  render: function () {
    this.renderWithTemplate(this)

    setTimeout(this.renderGraph.bind(this), 100)
  },
  renderGraph: function () {
    var cpuUsage = this.query('[data-hook=graph]')

    var fontStyle = {
      fontFamily: '"RobotoDraft", "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: 'normal',
      color: 'rgba(0, 0, 0, 0.84)'
    }

    var cpuSeries = [{
      name: 'User',
      data: []
    }, {
      name: 'Sys',
      data: []
    }, {
      name: 'Nice',
      data: []
    }, {
      name: 'IRQ',
      data: []
    }]

    if (this.model.cpus) {
      this.model.cpus.forEach(function (cpu) {
        cpuSeries[0].data.push(cpu.load.user)
        cpuSeries[1].data.push(cpu.load.sys)
        cpuSeries[2].data.push(cpu.load.nice)
        cpuSeries[3].data.push(cpu.load.irq)
      })
    }

    new Highcharts.Chart({
      //colors: [
      //  '#2A9FD6', '#0F0', '#FF5C5C', '#F5FF5C'
      //],
      chart: {
        type: 'column',
        renderTo: cpuUsage,
        spacing: [0, 0, 5, 0],
        backgroundColor: 'rgba(0, 0, 0, 0)'
      },
      title: {
        text: 'CPU',
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
      series: cpuSeries
    })
  },
  bindings: {
    'model.cpus': {
      type: function (el, cpus) {
        if (!cpus || !cpus.length) {
          return
        }

        var chart = Highcharts.charts[el.getAttribute('data-highcharts-chart')]

        if (!chart) {
          return
        }

        var data = [{
          name: 'user',
          data: []
        }, {
          name: 'sys',
          data: []
        }, {
          name: 'nice',
          data: []
        }, {
          name: 'irq',
          data: []
        }]

        cpus.forEach(function (cpu, index) {
          data[0].data[index] = cpu.load.user
          data[1].data[index] = cpu.load.sys
          data[2].data[index] = cpu.load.nice
          data[3].data[index] = cpu.load.irq
        })

        data.forEach(function (data, index) {
          // set series data but do not redraw yet
          chart.series[index].setData(data.data, false)
        })

        // redraw after updating points
        chart.redraw()
      },
      hook: 'graph'
    }
  }
})
