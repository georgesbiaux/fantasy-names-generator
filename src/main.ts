#!/usr/bin/env node

import { Command } from 'commander';
import { NameGenerator } from '@ksilvennoinen/markov-namegen';
import { promises as fs } from 'fs';
import { join } from 'path';
import { uniq } from 'lodash';
import { distance } from 'fastest-levenshtein';
import { City } from 'src/types';

const program = new Command();
program
  .name('fantasy-names-generator')
  .command('generate')
  .option('--data <string>')
  .option('--countries <string>')
  .action((command) =>
    generateCommand(command.data, command.countries?.split(',')),
  );

program.parse(process.argv);

async function generateCommand(
  dataFilePath?: string,
  countries?: string[],
): Promise<void> {
  if (dataFilePath) {
    return generateFromFile(dataFilePath);
  }

  if (countries) {
    return generateFromCountries(countries);
  }
}

async function generateFromFile(dataFilePath: string): Promise<void> {
  const data = await getData(dataFilePath);
  console.log(data.sort().join('\n'));
  console.log('--------------------------------------------');
  console.log('--------------------------------------------');

  const result = generateNames(data);
  console.log(result.join('\n'));
}

async function generateFromCountries(countryCodes: string[]): Promise<void> {
  const cities = await getCityNamesDictionary();
  const filteredCityNames = cities
    .filter((city) => countryCodes.includes(city.country_code))
    .map((city) => city.name);
  console.log('filteredCityNames', filteredCityNames.length);

  const result = generateNames(filteredCityNames);
  console.log(result.join('\n'));
}

function generateNames(data: string[]): string[] {
  const generator = new NameGenerator([...data], 1, 0, false);

  const names = generator
    .generateNames(200, 5, 12, '', '', '', '')
    .map((name) => name.trim())
    .sort();

  return uniq(names).filter(
    (name) =>
      !data.find(
        (city) =>
          city.toLowerCase().trim() === name.toLowerCase().trim() ||
          distance(name, city) === 1,
      ),
  );
}

async function getCityNamesDictionary(): Promise<City[]> {
  return JSON.parse(
    await fs.readFile(
      join(
        __dirname,
        '../databases/geonames-all-cities-with-a-population-1000.json',
      ),
      'utf8',
    ),
  );
}

async function getData(path: string): Promise<string[]> {
  return (await fs.readFile(path, 'utf8')).split('\n');
}
