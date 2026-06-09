import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { customerEmail, customerCompany } = await req.json();

  // Get user's CRM settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!settings) return NextResponse.json({ enrichment: null });

  let enrichment: any = {};

  // HubSpot enrichment
  if (settings.hubspot_key) {
    try {
      // Search for contact by email
      const contactRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.hubspot_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filterGroups: [{
              filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: customerEmail
              }]
            }],
            properties: ['firstname', 'lastname', 'jobtitle', 'phone', 'hs_lead_status', 'notes_last_contacted', 'num_contacted_notes']
          })
        }
      );
      const contactData = await contactRes.json();
      
      if (contactData.results?.length > 0) {
        const contact = contactData.results[0].properties;
        enrichment.hubspot = {
          job_title: contact.jobtitle,
          last_contacted: contact.notes_last_contacted,
          contact_count: contact.num_contacted_notes,
          lead_status: contact.hs_lead_status,
        };
      }

      // Search for company
      const companyRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/companies/search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.hubspot_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filterGroups: [{
              filters: [{
                propertyName: 'name',
                operator: 'CONTAINS_TOKEN',
                value: customerCompany
              }]
            }],
            properties: ['name', 'industry', 'numberofemployees', 'annualrevenue', 'description', 'hs_last_sales_activity_timestamp']
          })
        }
      );
      const companyData = await companyRes.json();

      if (companyData.results?.length > 0) {
        const company = companyData.results[0].properties;
        enrichment.hubspot_company = {
          industry: company.industry,
          employees: company.numberofemployees,
          annual_revenue: company.annualrevenue,
          last_activity: company.hs_last_sales_activity_timestamp,
        };
      }
    } catch (err) {
      console.error('HubSpot enrichment error:', err);
    }
  }

  // Microsoft Dynamics enrichment
  if (settings.dynamics_url && settings.dynamics_key) {
    try {
      const dynamicsRes = await fetch(
        `${settings.dynamics_url}/api/data/v9.2/contacts?$filter=emailaddress1 eq '${customerEmail}'&$select=fullname,jobtitle,telephone1,_parentcustomerid_value`,
        {
          headers: {
            'Authorization': `Bearer ${settings.dynamics_key}`,
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Accept': 'application/json',
          }
        }
      );
      const dynamicsData = await dynamicsRes.json();

      if (dynamicsData.value?.length > 0) {
        const contact = dynamicsData.value[0];
        enrichment.dynamics = {
          job_title: contact.jobtitle,
          phone: contact.telephone1,
        };
      }
    } catch (err) {
      console.error('Dynamics enrichment error:', err);
    }
  }

  return NextResponse.json({ enrichment });
}