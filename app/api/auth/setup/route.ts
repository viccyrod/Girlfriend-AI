import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET() {
  try {
    console.log('Entering GET function in /api/auth/setup');
    const { getUser } = getKindeServerSession();
    console.log('getKindeServerSession called successfully');
    
    const user = await getUser();
    console.log('User from getUser:', user);

    if (!user || !user.id) {
      console.log('User not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Perform any necessary setup logic here
    console.log('Setup completed successfully for user:', user.id);
    return NextResponse.json({ message: 'Setup completed successfully', userId: user.id });
  } catch (error) {
    console.error('Error in auth setup:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Internal Server Error', details: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Internal Server Error', details: 'An unknown error occurred' },
        { status: 500 }
      );
    }
  }
}

export async function POST() {
  try {
    console.log('Entering POST function in /api/auth/setup');
    const { getUser } = getKindeServerSession();
    console.log('getKindeServerSession called successfully');
    
    const user = await getUser();
    console.log('User from getUser:', user);

    if (!user || !user.id) {
      console.log('User not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Perform any necessary setup logic here
    console.log('Setup completed successfully for user:', user.id);
    return NextResponse.json({ message: 'Setup completed successfully', userId: user.id });
  } catch (error) {
    console.error('Error in auth setup:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Internal Server Error', details: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Internal Server Error', details: 'An unknown error occurred' },
        { status: 500 }
      );
    }
  }
}
