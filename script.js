import * as d3 from 'd3';
import data from '../BlackFriday.js';

const width = 900;
const height = 550;
const margin = { top: 80, right: 30, bottom: 70, left: 80 };

function drawStackedBarChart(selectedFilter = 'All', filterType = 'City_Category') {
  d3.select('#chart').html('');
  d3.select('#filter-wrapper').remove();

  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const chart = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const filteredData = selectedFilter === 'All'
    ? data
    : data.filter(d => d[filterType] === selectedFilter);

  const ageGenderMap = {};
  filteredData.forEach(d => {
    const age = d.Age;
    const gender = d.Gender;
    const purchase = +d.Purchase;
    if (!ageGenderMap[age]) {
      ageGenderMap[age] = { Age: age, Male: 0, Female: 0 };
    }
    if (gender === 'M') {
      ageGenderMap[age].Male += purchase;
    } else if (gender === 'F') {
      ageGenderMap[age].Female += purchase;
    }
  });

  const aggregated = Object.values(ageGenderMap);
  const subgroups = ['Male', 'Female'];
  const groups = aggregated.map(d => d.Age);

  const x = d3.scaleBand()
    .domain(groups)
    .range([0, innerWidth])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(aggregated, d => d.Male + d.Female)])
    .nice()
    .range([innerHeight, 0]);

  const color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(['#1f77b4', '#ff7f0e']);

  const stackedData = d3.stack()
    .keys(subgroups)(aggregated);

  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('background', '#333')
    .style('color', '#fff')
    .style('padding', '6px 10px')
    .style('border-radius', '4px')
    .style('font-size', '13px')
    .style('pointer-events', 'none')
    .style('opacity', 0);

  chart.append('g')
    .selectAll('g')
    .data(stackedData)
    .enter()
    .append('g')
    .attr('fill', d => color(d.key))
    .selectAll('rect')
    .data(d => d)
    .enter()
    .append('rect')
    .attr('x', d => x(d.data.Age))
    .attr('y', d => y(d[1]))
    .attr('height', d => y(d[0]) - y(d[1]))
    .attr('width', x.bandwidth())
    .on('mouseover', function (event, d) {
      tooltip.transition().duration(200).style('opacity', 0.9);
      const gender = d3.select(this.parentNode).datum().key;
      tooltip.html(
        `<strong>Age:</strong> ${d.data.Age}<br>` +
        `<strong>Gender:</strong> ${gender}<br>` +
        `<strong>Total Purchase:</strong> ${d[1] - d[0]}`
      )
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function () {
      tooltip.transition().duration(200).style('opacity', 0);
    });

  chart.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x));

  chart.append('g')
    .call(d3.axisLeft(y));

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .style('font-size', '18px')
    .style('font-weight', 'bold')
    .text('Total Purchase by Age Group (stacked by Gender)');

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height - 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text('Age');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text('Purchase');

  const legend = svg.append('g')
    .attr('transform', `translate(${width - 150}, ${margin.top})`);

  subgroups.forEach((gender, i) => {
    const legendRow = legend.append('g')
      .attr('transform', `translate(0, ${i * 20})`);

    legendRow.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', color(gender));

    legendRow.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .text(gender)
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const cities = Array.from(new Set(data.map(d => d.City_Category))).sort();
  const occupations = Array.from(new Set(data.map(d => d.Occupation))).sort();

  const filterWrapper = d3.select('body')
    .insert('div', ':first-child')
    .attr('id', 'filter-wrapper')
    .style('text-align', 'center')
    .style('margin-bottom', '10px')
    .html('<label>City Category: </label><select id="cityFilter"></select> ' +
      '<label>Occupation: </label><select id="occupationFilter"></select>');

  d3.select('#cityFilter')
    .selectAll('option')
    .data(['All', ...cities])
    .enter()
    .append('option')
    .text(d => d);

  d3.select('#occupationFilter')
    .selectAll('option')
    .data(['All', ...occupations])
    .enter()
    .append('option')
    .text(d => d);

  d3.select('#cityFilter').on('change', function () {
    drawStackedBarChart(this.value, 'City_Category');
  });

  d3.select('#occupationFilter').on('change', function () {
    drawStackedBarChart(this.value, 'Occupation');
  });

  drawStackedBarChart();
});
