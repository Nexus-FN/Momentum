import fs from 'fs/promises';
import path from 'path';
import Safety from './safety.js'; // Assuming this handles environment variables and safety checks
import { dirname } from 'dirname-filename-esm';
import fetch from 'node-fetch'; // Make sure to import 'node-fetch' if running in a Node.js environment
import { ShopResponse } from '../types/typings';

const __dirname = dirname(import.meta);

class Shop {
    public async updateShop(): Promise<ShopResponse[] | boolean[]> {
        const newItems: any[] = [];

        let shopResponse;
        try {
            shopResponse = await fetch(`https://fortnite.rest/shop/random/${Safety.env.MAIN_SEASON}`, {
                method: 'GET',
            });
        } catch (error) {
            console.error('Failed to fetch shop data:', error);
            return [false];
        }

        if (!shopResponse.ok) {
            console.error('Shop response not OK:', shopResponse.statusText);
            return [false];
        }

        const shopJSON = await shopResponse.json();

        const dailyItems = shopJSON.daily;
        const featuredItems = shopJSON.featured;

        const [catalogString, catalogRaw] = await Promise.all([
            fs.readFile(path.join(__dirname, "../../Config/catalog_config.json"), 'utf-8'),
            fs.readFile(path.join(__dirname, "../../responses/catalog.json"), 'utf-8'),
        ]);

        const catalog = JSON.parse(catalogString);
        const catalogRawJSON = JSON.parse(catalogRaw);


        dailyItems.forEach((item, i) => {
            const { shopName, price } = item;
            catalog[`daily${i + 1}`].price = price;
            catalog[`daily${i + 1}`].itemGrants = [shopName];
            newItems.push(item);
        });

        featuredItems.forEach((item, i) => {
            const { shopName, price } = item;
            catalog[`featured${i + 1}`].price = price;
            catalog[`featured${i + 1}`].itemGrants = [shopName];
            newItems.push(item);
        });

        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(24, 0, 0, 0);
        const todayOneMinuteBeforeMidnight = new Date(todayAtMidnight.getTime() - 60000);
        catalogRawJSON.expiration = todayOneMinuteBeforeMidnight.toISOString();

        await Promise.all([
            fs.writeFile(path.join(__dirname, "../../Config/catalog_config.json"), JSON.stringify(catalog, null, 4)),
            fs.writeFile(path.join(__dirname, "../../responses/catalog.json"), JSON.stringify(catalogRawJSON, null, 4)),
        ]);

        return newItems;
    }
}

export default new Shop();
