"use client";

import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import React, { ReactEventHandler, useState } from "react";

const SigninPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { data, error } = await authClient.signUp.email(
      {
        name,
        email,
        password,
        callbackURL: "/",
      },
      {
        onRequest: (ctx) => {
          console.log("Loading");
        },
        onSuccess: (ctx) => {
          redirect("/");
        },
        onError: (ctx) => {
          alert(ctx.error.message);
        },
      },
    );

    console.log(data);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-900 rounded-lg shadow-xl border border-gray-800">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 bg-gray-800 border border-gray-700 text-white rounded placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 bg-gray-800 border border-gray-700 text-white rounded placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 bg-gray-800 border border-gray-700 text-white rounded placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-500 transition duration-200"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default SigninPage;
