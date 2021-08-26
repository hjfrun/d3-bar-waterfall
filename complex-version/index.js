

const svg = d3.select('body')
  .select('svg')

const width = +svg.attr('width')
const height = +svg.attr('height')

const margin = { top: 70, right: 30, bottom: 45, left: 40 }

const innerWidth = width - margin.left - margin.right
const innerHeight = height - margin.top - margin.bottom
const padding = 0.5

const render = data => {

  let baseline_total = 0
  let target_total = 0

  for (let i = 0; i < data.length - 1; i++) {
    baseline_total += data[i].baseline
    target_total += data[i].target
  }

  const baseline_net = baseline_total - data[data.length - 1].baseline
  const target_net = target_total - data[data.length - 1].target

  const negLegth = data[data.length - 1].target

  let cumulative = baseline_total
  for (let i = 0; i < data.length; i++) {
    data[i].start = cumulative
    cumulative += data[i].diff
    data[i].end = cumulative
  }

  let baseline_y = baseline_total
  let target_y = target_total

  for (let i = 0; i < data.length; i++) {
    data[i].base_y = baseline_y
    data[i].next_base_y = baseline_y - data[i].baseline
    baseline_y -= data[i].baseline

    data[i].target_y = target_y
    data[i].next_target_y = target_y - data[i].target
    target_y -= data[i].target
  }

  console.log(data)

  const xScale = d3.scaleBand()
    .domain([{ name: '2030 Baseline' }, ...data, { name: '2030 Target' }].map(d => d.name))
    .range([0, innerWidth])
    .padding(padding)

  const yScale = d3.scaleLinear()
    .domain([-negLegth, baseline_total])
    .range([innerHeight, 0])

  const step = xScale.bandwidth() / (1 - padding)

  const colorScale = d3.scaleOrdinal()
    .domain(data.map(d => d.name))
    .range(['#26CF73', '#2C6EF2', '#FFBE00', '#06C9F4', '#FF8C00', '#50209B'])

  const xAxis = d3.axisBottom(xScale)
  const yAxis = d3.axisLeft(yScale)
    .ticks(1)
    .tickPadding(10)
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
    .call(wrap, step)

  xAxisG.selectAll('.domain, .tick line')
    .remove()

  yAxisG = g.append('g').attr('class', 'y axis').call(yAxis)
  yAxisG.select('.domain')
    .remove()
  yAxisG.select('.tick line')
    .style('stroke', 'black')

  const baselineBar = g.selectAll('.baseline-stacked-rect')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'baseline-stacked-rect')

  baselineBar
    .append('rect')
    .attr('x', step * padding)
    .attr('y', d => yScale(d.base_y))
    .attr('height', d => Math.abs(yScale(d.next_base_y) - yScale(d.base_y)))
    .attr('width', xScale.bandwidth())
    .attr('fill', d => colorScale(d.name))
  baselineBar
    .append('text')
    .attr('x', step * padding + xScale.bandwidth() * 0.5)
    .attr('y', d => (yScale(d.base_y) + yScale(d.next_base_y)) / 2)
    .style('dominant-baseline', 'middle')
    .style('fill', d => {
      if (d.name === 'Land Use' || d.name === 'Building Construction and Heating') {
        return 'black'
      }
      return 'white'
    })
    .text(d => d.baseline.toFixed(1))

  g.append('line')
    .attr('class', 'connector')
    .attr('x1', step)
    .attr('y1', yScale(baseline_total))
    .attr('x2', step * (padding + 1))
    .attr('y2', yScale(baseline_total))

  g.append('line')
    .attr('class', 'connector')
    .attr('x1', step)
    .attr('y1', yScale(-data[data.length - 1].baseline))
    .attr('x2', step * (padding + data.length))
    .attr('y2', yScale(-data[data.length - 1].baseline))

  g.append('line')
    .attr('class', 'connector')
    .attr('x1', step * (data.length + 1))
    .attr('y1', yScale(-data[data.length - 1].target))
    .attr('x2', step * (data.length + 1 + padding))
    .attr('y2', yScale(-data[data.length - 1].target))


  g.append('text')
    .attr('x', step * padding + xScale.bandwidth() * 0.5)
    .attr('y', yScale(baseline_total + 1.5))
    .style('fill', 'black')
    .style('dominant-baseline', 'middle')
    .text(baseline_net.toFixed(1))


  const targetBar = g.selectAll('.target-stacked-rect')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'target-stacked-rect')

  targetBar
    .append('rect')
    .attr('x', step * (data.length + 1 + padding))
    .attr('y', d => yScale(d.target_y))
    .attr('height', d => Math.abs(yScale(d.next_target_y) - yScale(d.target_y)))
    .attr('width', xScale.bandwidth())
    .attr('fill', d => colorScale(d.name))
  targetBar
    .append('text')
    .attr('x', step * (data.length + 1 + padding) + xScale.bandwidth() * 0.5)
    .attr('y', d => (yScale(d.target_y) + yScale(d.next_target_y)) / 2)
    .style('dominant-baseline', 'middle')
    .style('fill', d => {
      if (d.name === 'Land Use' || d.name === 'Building Construction and Heating') {
        return 'black'
      }
      return 'white'
    })
    .text(d => d.target.toFixed(1))

  g.append('text')
    .attr('x', step * (data.length + 1 + padding) + xScale.bandwidth() * 0.5)
    .attr('y', yScale(target_total + 1.5))
    .style('fill', 'black')
    .style('dominant-baseline', 'middle')
    .style('font-style', 'italic')
    .text(target_net.toFixed(1))


  const bar = g.selectAll('.bar')
    .data(data)
    .enter()
    .append('g')
    .attr('class', d => 'bar ' + d.class)
    .attr('transform', d => `translate(${xScale(d.name)}, 0)`)

  bar.append('rect')
    .attr('y', d => {
      if (d.diff < 0) {
        return yScale(Math.max(d.start, d.end))
      } else {
        return yScale(baseline_y)
      }
    })
    .attr('height', d => Math.abs(yScale(d.start) - yScale(d.end)))
    .attr('width', xScale.bandwidth())
    .attr('opacity', 0.5)
    .attr('fill', d => colorScale(d.name))

  bar.append('text')
    .attr('x', xScale.bandwidth() / 2)
    .attr('y', d => {
      if (d.diff < 0) {
        return (yScale(d.start) + yScale(d.end)) / 2
      } else {
        return (yScale(-d.baseline) + yScale(-d.target)) / 2
      }
    })
    .attr('dy', d => Math.abs(d.diff) > 2 ? 0 : -10)
    .attr('alignment-baseline', 'middle')
    .style('fill', 'black')
    .text(d => (d.diff > 0 ? '+' : '') + d.diff.toFixed(1))


  bar
    .filter(d => d.target < d.baseline)
    .append('line')
    .attr('class', 'connector')
    .attr('x1', xScale.bandwidth())
    .attr('y1', d => yScale(d.end))
    .attr('x2', d => d.name === 'Transportation' ? step * 2 : step)
    .attr('y2', d => yScale(d.end))

  g.append('line')
    .attr('class', 'top-line')
    .attr('x1', step * padding + xScale.bandwidth() * 0.5)
    .attr('y1', yScale(baseline_total + 3))
    .attr('x2', step * padding + xScale.bandwidth() * 0.5)
    .attr('y2', yScale(baseline_total + 6))

  g.append('line')
    .attr('class', 'top-line')
    .attr('x1', step * padding + xScale.bandwidth() * 0.5)
    .attr('y1', yScale(baseline_total + 6))
    .attr('x2', step * (data.length + 1 + padding) + xScale.bandwidth() * 0.5)
    .attr('y2', yScale(baseline_total + 6))

  g.append('line')
    .attr('class', 'top-line')
    .attr('x1', step * (data.length + 1 + padding) + xScale.bandwidth() * 0.5)
    .attr('y1', yScale(baseline_total + 6))
    .attr('x2', step * (data.length + 1 + padding) + xScale.bandwidth() * 0.5)
    .attr('y2', yScale(target_total + 3))

  g.append('circle')
    .attr('cx', step * (padding + data.length * 0.5 + 0.5) + xScale.bandwidth() * 0.5)
    .attr('cy', yScale(baseline_total + 6))
    .attr('r', 20)
    .style('fill', '#808080')

  g.append('text')
    .attr('x', step * (padding + data.length * 0.5 + 0.5) + xScale.bandwidth() * 0.5)
    .attr('y', yScale(baseline_total + 6))
    .style('dominant-baseline', 'middle')
    .style('fill', 'white')
    .text((target_net - baseline_net).toFixed(1))

}

d3.csv('data.csv').then(data => {
  data.forEach(d => {
    d.baseline = Math.abs(+d.baseline / 1000)
    d.target = Math.abs(+d.target / 1000)
    d.diff = d.target - d.baseline
  })
  render(data)
})

function wrap(text, width) {
  text.each(function() {
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

