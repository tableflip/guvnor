var View = require('ampersand-view')
var HighCharts = require('highcharts-browserify/modules/solid-gauge')

module.exports = View.extend({
  template: require('./resources.hbs'),
  render: function () {
    this.renderWithTemplate(this)

    var cpuUsage = this.query('[data-hook=cpu-usage]')

    var fontStyle = {
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '14px',
      fontWeight: 'normal',
      color: '#BDBDBD'
    }

    var cpuSeries = [{
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

    if (this.model.cpus) {
      this.model.cpus.forEach(function (cpu) {
        cpuSeries[0].data.push(cpu.load.user)
        cpuSeries[1].data.push(cpu.load.sys)
        cpuSeries[2].data.push(cpu.load.nice)
        cpuSeries[3].data.push(cpu.load.irq)
      })
    }

    this._cpuChart = new HighCharts.Chart({
      colors: [
        '#2A9FD6', '#0F0', '#FF5C5C', '#F5FF5C'
      ],
      chart: {
        type: 'column',
        renderTo: cpuUsage,
        spacing: [0, 0, 5, 0],
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: '#444'
      },
      title: {
        text: 'CPU (' + this.model.cpuSpeed + ')',
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

    // cache an element for easy reference by other methods
    var memoryUsage = this.query('[data-hook=memory-usage]')

    this._memoryChart = new HighCharts.Chart({
      chart: {
        type: 'solidgauge',
        renderTo: memoryUsage,
        backgroundColor: 'rgba(0, 0, 0, 0)'
      },
      title: {
        text: 'Memory (' + this.model.totalMemoryFormatted + ')',
        style: fontStyle
      },
      credits: {
        enabled: false
      },
      pane: {
        center: ['50%', '73%'],
        size: '140%',
        startAngle: -90,
        endAngle: 90,
        background: {
          backgroundColor: '#181818',
          innerRadius: '60%',
          outerRadius: '100%',
          shape: 'arc',
          borderColor: '#444'
        }
      },
      tooltip: {
        enabled: false
      },
      yAxis: {
        stops: [
          [0.1, '#55BF3B'], // green
          [0.6, '#DDDF0D'], // yellow
          [0.8, '#DF5353'] // red
        ],
        lineWidth: 0,
        minorTickInterval: null,
        tickPixelInterval: 400,
        tickWidth: 0,
        labels: {
          y: 16,
          style: fontStyle
        },
        min: 0,
        max: 100,
        title: {
          text: null
        },
        plotBands: [{
          from: 0,
          to: 60,
          color: '#55BF3B', // green
          zIndex: 5
        }, {
          from: 60,
          to: 80,
          color: '#DDDF0D', // yellow
          zIndex: 5
        }, {
          from: 80,
          to: 100,
          color: '#DF5353', // red
          zIndex: 5
        }]
      },
      plotOptions: {
        solidgauge: {
          dataLabels: {
            y: -5,
            borderWidth: 0,
            useHTML: true
          }
        }
      },
      series: [{
        name: 'Memory',
        data: [this.model.usedMemory],
        dataLabels: {
          format: '<div style="text-align:center;font-size:25px;color:#BDBDBD">{y}%</span></div>',
          borderColor: 'rgba(0, 0, 0, 0)',
          y: 50
        }
      }]
    })
  },
  bindings: {
    'model.cpus': {
      type: function (el, cpus) {
        if (!cpus || !cpus.length) {
          return
        }

        var chart = HighCharts.charts[el.getAttribute('data-highcharts-chart')]

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
      selector: '[data-hook=cpu-usage]'
    },

    'model.usedMemory': {
      type: function (el, usedMemory) {
        if (!usedMemory) {
          return
        }

        var chart = HighCharts.charts[el.getAttribute('data-highcharts-chart')]

        if (!chart) {
          return
        }

        var point = chart.series[0].points[0]
        point.update(usedMemory)
      },
      selector: '[data-hook=memory-usage]'
    }
  }
})
