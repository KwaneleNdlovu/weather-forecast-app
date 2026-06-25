import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import bodyParser from 'body-parser';


const app = express();
const port = 3000;

const API_KEY = process.env.API_KEY;
const URL = "https://api.openweathermap.org";

const weatherDescriptions = {
    0: "Clear Sky",

    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",

    45: "Fog",
    48: "Rime Fog",

    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Heavy Drizzle",

    56: "Light Freezing Drizzle",
    57: "Heavy Freezing Drizzle",

    61: "Light Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",

    66: "Light Freezing Rain",
    67: "Heavy Freezing Rain",

    71: "Light Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",

    77: "Snow Grains",

    80: "Light Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",

    85: "Light Snow Showers",
    86: "Heavy Snow Showers",

    95: "Thunderstorm",

    96: "Thunderstorm with Light Hail",
    99: "Thunderstorm with Heavy Hail"
};

const weatherImages = {
    0: "/images/weather/clear.svg",

    1: "/images/weather/cloudy.svg",
    2: "/images/weather/cloudy.svg",
    3: "/images/weather/cloudy.svg",

    45: "/images/weather/fog.svg",
    48: "/images/weather/fog.svg",

    51: "/images/weather/drizzle.svg",
    53: "/images/weather/drizzle.svg",
    55: "/images/weather/drizzle.svg",

    56: "/images/weather/drizzle.svg",
    57: "/images/weather/drizzle.svg",

    61: "/images/weather/rain.svg",
    63: "/images/weather/rain.svg",
    65: "/images/weather/rain.svg",

    66: "/images/weather/rain.svg",
    67: "/images/weather/rain.svg",

    71: "/images/weather/snow.svg",
    73: "/images/weather/snow.svg",
    75: "/images/weather/snow.svg",
    77: "/images/weather/snow.svg",

    80: "/images/weather/rain.svg",
    81: "/images/weather/rain.svg",
    82: "/images/weather/rain.svg",

    85: "/images/weather/snow.svg",
    86: "/images/weather/snow.svg",

    95: "/images/weather/thunderstorm.svg",
    96: "/images/weather/thunderstorm.svg",
    99: "/images/weather/thunderstorm.svg"
};

const defaultWeather = {
    loc: "--",
    temp: "--",
    humidity: "--",
    windSpeed: "--",
    dayNight: "--",
    description: "Search for a city",
    rainChance: "--",
    weatherImage: "/images/weather/clear.svg",
    day : ["--", "--", "--", "--", "--"],
    code_description: ["--", "--", "--", "--", "--"],
    max_temp : ["--", "--", "--", "--", "--"],
    min_temp : ["--", "--", "--", "--", "--"],
    precipitation : ["--", "--", "--", "--", "--"],
    wind : ["--", "--", "--", "--", "--"],
    images : ["/images/weather/clear.svg","/images/weather/clear.svg","/images/weather/clear.svg","/images/weather/clear.svg", "/images/weather/clear.svg"],
    isDay : 0
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index.ejs", defaultWeather);
})

app.post("/search", async (req, res) => {

    const loc = req.body.location;
    try{

        const geo = await axios.get(URL + `/geo/1.0/direct?q=${loc}&limit=1&appid=${API_KEY}`);
        
        
        if(geo.data.length === 0) {
            return res.render("index.ejs", defaultWeather);
        }

        const lat = geo.data[0].lat;
        const lon = geo.data[0].lon; 
        
        const weather_data = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&hourly=precipitation_probability`
        );

        const daily_weather = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&forecast_days=6`
        );

        const day = daily_weather.data.daily.time;
        const code = daily_weather.data.daily.weather_code;
        const max_temp = daily_weather.data.daily.temperature_2m_max;
        const min_temp = daily_weather.data.daily.temperature_2m_min;
        const precipitation = daily_weather.data.daily.precipitation_probability_max;
        const wind = daily_weather.data.daily.wind_speed_10m_max;
        
        const code_description = [];
        for(let index = 0; index < code.length; index++) {
            code_description[index] = weatherDescriptions[code[index]];
        }

        const images = [];
        for(let index = 0; index < code.length; index++) {
            images[index] = weatherImages[code[index]];
        }
        const current = weather_data.data.current;

        const temp = current.temperature_2m;
        const humidity = current.relative_humidity_2m;
        const weatherCode = current.weather_code;
        const windSpeed = current.wind_speed_10m;
        const isDay = current.is_day;

        const description = weatherDescriptions[weatherCode] || "Unknown Weather";
        const rainChance = weather_data.data.hourly.precipitation_probability[0];
        const dayNight = isDay ? "Day" : "Night";

        let weatherImage;

        if (weatherCode === 0) {
            weatherImage = isDay ? "/images/weather/sunny.svg" : "/images/weather/night.svg";
        } else {
            weatherImage = weatherImages[weatherCode] || "/images/weather/clear.svg";
        }

        res.render("index.ejs", {
            temp : temp,
            humidity : humidity,
            windSpeed : windSpeed,
            dayNight : dayNight,
            description : description,
            rainChance : rainChance,
            weatherImage : weatherImage,
            loc : "in " + loc.toUpperCase(),
            day,
            code_description,
            max_temp,
            min_temp,
            precipitation,
            wind,
            images,
            isDay
        });
        
    } catch(error) { 
        res.render("index.ejs", defaultWeather);
    }
}); 

app.listen(port, () =>{
    console.log(`Server running on port ${port}`)
})
