"use client"

import React, { useState } from 'react';

function Home() {
  const [userName, setUserName] = useState('');

  return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name]">
        <main className="flex flex-col justify-center mx-auto w-full">
          <div className="flex items-center gap-4">
            <input type="text" placeholder="Enter your name here" value={userName} onChange={(e) => setUserName(e.target.value)} />
            <button onClick={() => { console.log(`Hello, ${userName}`); }}>Submit</button>
          </div>
        </main>
      </div>
  );
}

export default Home;
