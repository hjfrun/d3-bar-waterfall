

const svg = d3.select('body')
  .select('svg')

const width = +svg.attr('width')
const height = +svg.attr('height')

const margin = { top: 40, right: 30, bottom: 40, left: 40 }

const innerWidth = width - margin.left - margin.right
const innerHeight = height - margin.top - margin.bottom
const padding = 0.4

const render = data => {
  let cumulative = 0
  for (let i = 0; i < data.length; i++) {
    data[i].start = cumulative
    cumulative += data[i].value
    data[i].end = cumulative

    data[i].class = data[i].value >= 0 ? 'positive' : 'negative'
  }
  for (let i = 0; i < data.length - 1; i++) {
    data[i].next_end = data[i + 1].end
  }
  data[data.length - 1].next_end = 0
  data.push({
    name: 'Target',
    end: cumulative,
    next_end: 0,
    start: 0,
    class: 'total'
  })
  console.log('data', data)

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([0, innerWidth])
    .padding(padding)

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.end)])
    .range([innerHeight, 0])
    .nice()

  const xAxis = d3.axisBottom(xScale)
  const yAxis = d3.axisLeft(yScale)
    .ticks(6)
    .tickFormat(number => d3.format('.0s')(number))
    .tickSize(-innerWidth)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const xAxisG = g.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(xAxis)
  xAxisG
    .selectAll('.tick text')
    .call(wrap, xScale.bandwidth() * 1.5)

  xAxisG.selectAll('.domain, .tick line')
    .remove()

  yAxisG = g.append('g').attr('class', 'y axis').call(yAxis)
  yAxisG.select('.domain')
    .remove()
  yAxisG.select('.tick line')
    .style('stroke', 'black')

  const bar = g.selectAll('.bar')
    .data(data)
    .enter()
    .append('g')
    .attr('class', d => 'bar ' + d.class)
    .attr('transform', d => `translate(${xScale(d.name)}, 0)`)

  bar.append('rect')
    .attr('y', d => yScale(Math.max(d.start, d.end)))
    .attr('height', d => Math.abs(yScale(d.start) - yScale(d.end)))
    .attr('width', xScale.bandwidth())

  bar.append('text')
    .attr('x', xScale.bandwidth() / 2)
    .attr('y', d => (yScale(d.start) + yScale(d.end)) / 2)
    .attr('alignment-baseline', 'middle')
    .style('fill', (d, i) => {
      if (i === 0 || d.class === 'total') return 'white'
      else return 'black'
    })
    .text(d => Math.abs(d.end - d.start).toFixed(1))

  bar.filter(d => d.class !== 'total')
    .append('path')
    .style('fill', (d, i) => {
      if (i === 0) return 'black'
      else if (d.next_end === 0) return '#2c6ef2'
      else return '#c8dc88'
    })
    .style('opacity', '0.15')
    .attr('d', (d, i) => {
      const path = d3.path()
      path.moveTo(xScale.bandwidth(), yScale(d.end))
      if (i === 0) {
        path.lineTo(xScale.bandwidth() / (1 - padding), yScale(d.end))
        path.lineTo(xScale.bandwidth() / (1 - padding), yScale(d.next_end))
      } else {
        path.lineTo(xScale.bandwidth() / (1 - padding), yScale(d.next_end))
        path.lineTo(xScale.bandwidth() / (1 - padding), yScale(d.end))
      }
      path.lineTo(xScale.bandwidth(), yScale(d.start))
      path.closePath()
      return path
    })
}

d3.csv('data.csv').then(data => {
  data.forEach(d => {
    d.value = +d.value
  })
  console.log('data ....', data)
  render(data)
})

function wrap(text, width) {
  text.each(function() {
    console.log('d3 this', d3.select(this))
    var text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      y = text.attr("y"),
      dy = parseFloat(text.attr("dy")),
      tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em")
    while (word = words.pop()) {
      line.push(word)
      tspan.text(line.join(" "))
      if (tspan.node().getComputedTextLength() > width) {
        line.pop()
        tspan.text(line.join(" "))
        line = [word]
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(word)
      }
    }
  })
}

