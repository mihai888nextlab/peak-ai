import { User, findUserById, updateUserOpenWearablesId } from './models/user';

const API_URL = process.env.OPENWEARABLES_API_URL || 'http://localhost:8001';
const API_KEY = process.env.OPENWEARABLES_API_KEY;

const authHeaders = {
  'X-Open-Wearables-API-Key': API_KEY || '',
};

async function getOrFindDefaultUser(): Promise<string | null> {
  // Try to find the default user that has Strava connected
  const usersRes = await fetch(`${API_URL}/api/v1/users?limit=10`, {
    headers: authHeaders,
  });
  
  if (usersRes.ok) {
    const usersData = await usersRes.json();
    // Find user with Strava connection
    for (const user of (usersData.items || [])) {
      const connRes = await fetch(`${API_URL}/api/v1/users/${user.id}/connections`, {
        headers: authHeaders,
      });
      if (connRes.ok) {
        const connections = await connRes.json();
        if (connections.some((c: any) => c.provider === 'strava' && c.status === 'active')) {
          console.log('Found Strava-connected user:', user.id);
          return user.id;
        }
      }
    }
    // Return first user if no Strava connection found
    if (usersData.items?.length > 0) {
      return usersData.items[0].id;
    }
  }
  
  return null;
}

export async function getOrCreateOpenWearablesUser(peakUserId: string): Promise<string | null> {
  if (!peakUserId) {
    console.error('No peakUserId provided, trying default user');
    return getOrFindDefaultUser();
  }

  const user = await findUserById(peakUserId);
  if (!user) {
    console.error('User not found in MongoDB:', peakUserId, '- using default user');
    return getOrFindDefaultUser();
  }

  if (user.openwearablesUserId) {
    const checkRes = await fetch(`${API_URL}/api/v1/users/${user.openwearablesUserId}`, {
      headers: authHeaders,
    });
    if (checkRes.ok) {
      return user.openwearablesUserId;
    }
  }

  const createRes = await fetch(`${API_URL}/api/v1/users`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      first_name: user.name.split(' ')[0] || 'User',
      last_name: user.name.split(' ').slice(1).join(' ') || null,
      external_user_id: peakUserId,
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    console.error('Failed to create OpenWearables user:', createRes.status, errorText);
    return getOrFindDefaultUser();
  }

  const owUser = await createRes.json();
  
  // Save the mapping in MongoDB
  if (owUser.id) {
    await updateUserOpenWearablesId(peakUserId, owUser.id);
  }
  
  return owUser.id;
}

export async function getUserConnections(owUserId: string) {
  const res = await fetch(`${API_URL}/api/v1/users/${owUserId}/connections`, {
    headers: authHeaders,
  });
  if (!res.ok) return [];
  return res.json();
}

export async function syncProviderData(owUserId: string, provider: string, dataType: string = 'all') {
  const res = await fetch(`${API_URL}/api/v1/providers/${provider}/users/${owUserId}/sync?data_type=${dataType}`, {
    method: 'POST',
    headers: authHeaders,
  });
  return res.json();
}

export async function getUserWorkouts(owUserId: string, startDate?: string, endDate?: string) {
  let allWorkouts: any[] = [];
  
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  const queryString = params.toString();
  
  const endpoints = [
    `${API_URL}/api/v1/providers/strava/users/${owUserId}/workouts${queryString ? '?' + queryString : ''}`,
    `${API_URL}/api/v1/users/${owUserId}/events/workouts${queryString ? '?' + queryString : ''}`,
    `${API_URL}/api/v1/users/${owUserId}/workouts${queryString ? '?' + queryString : ''}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: authHeaders });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json.items || json || [];
        if (Array.isArray(data) && data.length > 0) {
          allWorkouts = [...allWorkouts, ...data];
        }
      }
    } catch (err) {
      console.error('Error fetching from endpoint:', url, err);
    }
  }

  const uniqueById = Array.from(new Map(allWorkouts.map((w: any) => [w.id?.toString(), w])).values());
  return uniqueById;
}

export async function getUserSleep(owUserId: string, startDate?: string, endDate?: string) {
  let url = `${API_URL}/api/v1/users/${owUserId}/events/sleep`;
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url, { headers: authHeaders });
  if (!res.ok) return [];
  return res.json();
}

export async function getUserTimeseries(
  owUserId: string,
  types: string[],
  startTime: string,
  endTime: string
) {
  const params = new URLSearchParams();
  params.set('start_time', startTime);
  params.set('end_time', endTime);
  types.forEach(t => params.append('types', t));

  const res = await fetch(`${API_URL}/api/v1/users/${owUserId}/timeseries?${params}`, {
    headers: authHeaders,
  });
  if (!res.ok) return {};
  return res.json();
}

export async function getActivitySummary(owUserId: string, date?: string) {
  const params = date ? `?date=${date}` : '';
  const res = await fetch(`${API_URL}/api/v1/users/${owUserId}/summaries/activity${params}`, {
    headers: authHeaders,
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getSleepSummary(owUserId: string, date?: string) {
  const params = date ? `?date=${date}` : '';
  const res = await fetch(`${API_URL}/api/v1/users/${owUserId}/summaries/sleep${params}`, {
    headers: authHeaders,
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getRecoverySummary(owUserId: string, date?: string) {
  const params = date ? `?date=${date}` : '';
  const res = await fetch(`${API_URL}/api/v1/users/${owUserId}/summaries/recovery${params}`, {
    headers: authHeaders,
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getBodySummary(owUserId: string, date?: string) {
  const params = date ? `?date=${date}` : '';
  const res = await fetch(`${API_URL}/api/v1/users/${owUserId}/summaries/body${params}`, {
    headers: authHeaders,
  });
  if (!res.ok) return null;
  return res.json();
}
