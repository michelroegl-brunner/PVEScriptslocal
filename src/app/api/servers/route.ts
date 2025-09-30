import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getDatabase } from '../../../server/database';
import type { CreateServerData } from '../../../types/server';

export async function GET() {
  try {
    const db = getDatabase();
    const servers = db.getAllServers();
    return NextResponse.json(servers);
  } catch (error) {
    console.error('Error fetching servers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, ip, user, password }: CreateServerData = body;

    // Validate required fields
    if (!name || !ip || !user || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const result = db.createServer({ name, ip, user, password });
    
    return NextResponse.json(
      { 
        message: 'Server created successfully',
        id: result.lastInsertRowid 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating server:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A server with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create server' },
      { status: 500 }
    );
  }
}

