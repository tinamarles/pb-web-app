import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {  
    const baseUrl = 'https://pb-web-app.vercel.app'  
    
    return [  
        {  
            url: baseUrl,  
            lastModified: new Date(),  
            changeFrequency: 'yearly',  
            priority: 1,  
        },  
        {  
            url: `${baseUrl}/login`,  
            lastModified: new Date(),  
            changeFrequency: 'monthly',  
            priority: 0.8,  
        },  
        {  
            url: `${baseUrl}/signup`,  
            lastModified: new Date(),  
            changeFrequency: 'monthly',  
            priority: 0.8,  
        },  
        {  
            url: `${baseUrl}/profile/details`,  
            lastModified: new Date(),  
            changeFrequency: 'weekly',  
            priority: 0.5,  
        },  
        {  
            url: `${baseUrl}/dashboard/public`,  
            lastModified: new Date(),  
            changeFrequency: 'daily',  
            priority: 0.7,  
        },  
    ]  
}  