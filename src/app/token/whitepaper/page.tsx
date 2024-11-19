'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import BaseLayout from "@/components/BaseLayout";
import Link from "next/link";
import Image from "next/image";
import { Shield, CreditCard, Coins, Network, Lock, Cpu, Users, Building, BookOpen, Code, LineChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { TokenDistributionChart } from "@/components/charts/TokenDistribution";
import { VestingScheduleChart } from "@/components/charts/VestingSchedule";
import { TechnicalArchitecture } from "@/components/charts/TechnicalArchitecture";

export default function WhitepaperPage() {
  return (
    <BaseLayout requireAuth={false}>
      {/* Hero Section */}
      <div className="relative bg-black text-white">
        <div className="container mx-auto py-16 px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-center">
              $GOON Token <span className="text-[#ff4d8d]">Whitepaper</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 text-center">
              Revolutionizing Adult Industry Payments & AI Dating Ecosystem
            </p>
          </div>
        </div>
        
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-16 px-4">
        {/* Introduction */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Introduction</h2>
          <p className="text-gray-300 mb-4">
            $GOON token is designed to address two critical challenges in the modern digital landscape:
            the need for secure, private payments in the adult industry and the growing demand for
            AI-powered companionship platforms.
          </p>
        </section>

        {/* Tokenomics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Tokenomics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-black/50 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/20">
              <h3 className="text-2xl font-bold mb-4">Token Distribution</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Public Sale</span>
                  <span className="text-pink-500">40%</span>
                </li>
                <li className="flex justify-between">
                  <span>Platform Development</span>
                  <span className="text-pink-500">25%</span>
                </li>
                <li className="flex justify-between">
                  <span>Team & Advisors</span>
                  <span className="text-pink-500">15%</span>
                </li>
                <li className="flex justify-between">
                  <span>Marketing</span>
                  <span className="text-pink-500">10%</span>
                </li>
                <li className="flex justify-between">
                  <span>Community Rewards</span>
                  <span className="text-pink-500">10%</span>
                </li>
              </ul>
            </div>
            <div className="bg-black/50 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/20">
              <h3 className="text-2xl font-bold mb-4">Token Details</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Total Supply</span>
                  <span className="text-pink-500">69,000,000,000 GOON</span>
                </li>
                <li className="flex justify-between">
                  <span>Pre-Sale Price</span>
                  <span className="text-pink-500">$0.00001449275</span>
                </li>
                <li className="flex justify-between">
                  <span>Network</span>
                  <span className="text-pink-500">Solana</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Utility */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Token Utility</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black/50 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/20">
              <Shield className="h-12 w-12 text-pink-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Private Payments</h3>
              <p className="text-gray-300">
                Secure, anonymous payment processing for adult content creators and platforms
              </p>
            </div>
            <div className="bg-black/50 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/20">
              <CreditCard className="h-12 w-12 text-pink-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Payment Gateway</h3>
              <p className="text-gray-300">
                Integrated payment solution for adult industry businesses with low fees
              </p>
            </div>
            <div className="bg-black/50 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/20">
              <Coins className="h-12 w-12 text-pink-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Platform Currency</h3>
              <p className="text-gray-300">
                Native token for all Girlfriend.cx platform transactions and premium features
              </p>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Development Roadmap</h2>
          <div className="space-y-8">
            {/* Phase 1: MVP and Validation */}
            <div className="bg-black/50 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-pink-500/20 p-2 rounded-lg">
                  <BookOpen className="h-6 w-6 text-pink-500" />
                </div>
                <h3 className="text-2xl font-bold">Phase 1: MVP and Validation</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Develop MVP of AI Powered Software</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Promotional airdrops to build community</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Prove Alpha, Metrics, and Business Model</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Create board of advisors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Early customers and product validation</span>
                  </li>
                </ul>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Design long term Tokenomics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Smart Contract MVP</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Token Launch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Activate Phase 1 Marketing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Prove business model and generate $10,000+ in revenue</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Phase 2: Growth */}
            <div className="bg-black/50 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-pink-500/20 p-2 rounded-lg">
                  <LineChart className="h-6 w-6 text-pink-500" />
                </div>
                <h3 className="text-2xl font-bold">Phase 2: Growth</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>5000+ Holders + 50M Market Cap</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>100+ Paying Software Customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Minor Centralized Exchanges Listing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>$100k Monthly Recurring Revenue (MRR) for SAAS</span>
                  </li>
                </ul>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Mobile App Launch for SAAS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>100+ Payment Processing Customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>$1m in BuildPay Payments Processing Monthly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Listing on DexScreener, BirdEye, CoinGecko and CoinMarketCap</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Phase 3: Expansion */}
            <div className="bg-black/50 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-pink-500/20 p-2 rounded-lg">
                  <Network className="h-6 w-6 text-pink-500" />
                </div>
                <h3 className="text-2xl font-bold">Phase 3: Expansion</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Base and Other Chains Launch (Multi-chain)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>1,000+ Paying Software Customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>$1m Monthly Recurring Revenue (MRR) for SAAS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>10,000+ Holders + 100M Market Cap</span>
                  </li>
                </ul>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Community Partnerships</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>1,000+ Payment Processing Customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>$10m in BuildPay payments processing monthly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Monthly Token Buyback + Burn From 50% of SAAS Net Profits</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Phase 4: Scaling */}
            <div className="bg-black/50 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-pink-500/20 p-2 rounded-lg">
                  <Building className="h-6 w-6 text-pink-500" />
                </div>
                <h3 className="text-2xl font-bold">Phase 4: Scaling</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Major Centralized Exchanges Listing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>5000+ Paying Software Customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>50,000+ Holders + 1 Billion Market Cap</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>$5m Monthly Recurring Revenue (MRR) for SAAS</span>
                  </li>
                </ul>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>10,000 Payments Processing customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>$100m in BuildPay Payments Processing Monthly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Corporate partnerships for Further Global Reach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1.5">•</div>
                    <span>Global Expansion, Software Rolled Out to Every Major Market</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Architecture Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Technical Architecture</h2>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payment">Payment Processing</TabsTrigger>
              <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
              <TabsTrigger value="smart-contracts">Smart Contracts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card className="bg-black/50 backdrop-blur-xl p-6 border-pink-500/20">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">System Overview</h3>
                  <TechnicalArchitecture />
                  <p className="text-gray-300">
                    The $GOON token ecosystem is built on Solana for high throughput and low transaction costs.
                    Key components include:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li>• SPL Token Standard Implementation</li>
                    <li>• Custom Payment Gateway Smart Contracts</li>
                    <li>• Privacy-Preserving Transaction Layer</li>
                    <li>• Cross-chain Bridge Infrastructure</li>
                  </ul>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="payment">
              <Card className="bg-black/50 backdrop-blur-xl p-6 border-pink-500/20">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Payment Processing Flow</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xl font-semibold mb-4">Features</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li>• Zero-knowledge proof transactions</li>
                        <li>• Instant settlement</li>
                        <li>• Multi-currency support</li>
                        <li>• Automated compliance checks</li>
                        <li>• Dispute resolution system</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-4">Integration</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li>• REST API endpoints</li>
                        <li>• SDK for major platforms</li>
                        <li>• Webhook notifications</li>
                        <li>• Custom integration support</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card className="bg-black/50 backdrop-blur-xl p-6 border-pink-500/20">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Privacy & Security Architecture</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xl font-semibold mb-4">Privacy Features</h4>
                      <ul className="space-y-3 text-gray-300">
                        <li className="flex items-center gap-2">
                          <Lock className="h-5 w-5 text-pink-500" />
                          <span>Zero-knowledge transaction processing</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-pink-500" />
                          <span>End-to-end encryption for all communications</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Network className="h-5 w-5 text-pink-500" />
                          <span>Decentralized identity management</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Cpu className="h-5 w-5 text-pink-500" />
                          <span>Secure multi-party computation</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold mb-4">Security Measures</h4>
                      <ul className="space-y-3 text-gray-300">
                        <li className="flex items-center gap-2">
                          <Code className="h-5 w-5 text-pink-500" />
                          <span>Regular smart contract audits</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-pink-500" />
                          <span>Multi-signature treasury management</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-pink-500" />
                          <span>Community-driven security governance</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <LineChart className="h-5 w-5 text-pink-500" />
                          <span>Real-time transaction monitoring</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-pink-500/10 rounded-lg border border-pink-500/20">
                    <h4 className="text-lg font-semibold mb-2">Security Commitment</h4>
                    <p className="text-gray-300">
                      The $GOON token platform prioritizes user privacy and security through a combination of 
                      cutting-edge cryptographic techniques, regular security audits, and transparent governance 
                      processes. Our multi-layered approach ensures the highest standards of protection for all 
                      platform participants.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="smart-contracts">
              <Card className="bg-black/50 backdrop-blur-xl p-6 border-pink-500/20">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Smart Contract Architecture</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xl font-semibold mb-4">Core Contracts</h4>
                      <ul className="space-y-3 text-gray-300">
                        <li className="flex items-center gap-2">
                          <Coins className="h-5 w-5 text-pink-500" />
                          <span>SPL Token Implementation</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-pink-500" />
                          <span>Payment Gateway Router</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Lock className="h-5 w-5 text-pink-500" />
                          <span>Access Control Manager</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Network className="h-5 w-5 text-pink-500" />
                          <span>Cross-chain Bridge</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold mb-4">Platform Contracts</h4>
                      <ul className="space-y-3 text-gray-300">
                        <li className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-pink-500" />
                          <span>Governance System</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-pink-500" />
                          <span>Treasury Management</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-pink-500" />
                          <span>Privacy Protocol</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Cpu className="h-5 w-5 text-pink-500" />
                          <span>AI Model Access Control</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <h4 className="text-xl font-semibold">Technical Specifications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-pink-500/10 p-4 rounded-lg border border-pink-500/20">
                        <h5 className="font-semibold mb-2">Contract Standards</h5>
                        <ul className="space-y-1 text-gray-300 text-sm">
                          <li>• Solana Program Library (SPL) Token Standard</li>
                          <li>• Cross-Program Invocation (CPI) Compatible</li>
                          <li>• Program Derived Addresses (PDAs)</li>
                        </ul>
                      </div>
                      <div className="bg-pink-500/10 p-4 rounded-lg border border-pink-500/20">
                        <h5 className="font-semibold mb-2">Security Features</h5>
                        <ul className="space-y-1 text-gray-300 text-sm">
                          <li>• Multi-signature Authorization</li>
                          <li>• Time-locked Transactions</li>
                          <li>• Upgradeable Program Architecture</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Charts & Analytics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Token Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-black/50 backdrop-blur-xl p-6 border-pink-500/20">
              <h3 className="text-2xl font-bold mb-4">Token Distribution</h3>
              <TokenDistributionChart />
            </Card>
            <Card className="bg-black/50 backdrop-blur-xl p-6 border-pink-500/20">
              <h3 className="text-2xl font-bold mb-4">Vesting Schedule</h3>
              <VestingScheduleChart />
            </Card>
          </div>
        </section>
      </div>
    </BaseLayout>
  );
}

// function RoadmapItem({ quarter, title, items }: { quarter: string; title: string; items: string[] }) {
//   return (
//     <div className="bg-black/50 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/20">
//       <div className="flex items-center gap-4 mb-4">
//         <span className="text-pink-500 font-mono">{quarter}</span>
//         <h3 className="text-xl font-bold">{title}</h3>
//       </div>
//       <ul className="space-y-2">
//         {items.map((item, index) => (
//           <li key={index} className="flex items-center gap-2">
//             <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
//             <span className="text-gray-300">{item}</span>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// Add TeamMember component
// function TeamMember({ 
//   name, 
//   role, 
//   image, 
//   linkedin, 
//   bio 
// }: { 
//   name: string; 
//   role: string; 
//   image: string; 
//   linkedin: string; 
//   bio: string; 
// }) {
//   return (
//     <div className="bg-black/50 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/20">
//       <div className="relative w-32 h-32 mx-auto mb-4">
//         <Image
//           src={image}
//           alt={name}
//           fill
//           className="rounded-full object-cover"
//         />
//       </div>
//       <h3 className="text-xl font-bold text-center mb-2">{name}</h3>
//       <p className="text-pink-500 text-center mb-2">{role}</p>
//       <p className="text-gray-300 text-center text-sm mb-4">{bio}</p>
//       <div className="flex justify-center">
//         <Link href={linkedin} target="_blank">
//           <Button variant="outline" size="sm">
//             LinkedIn Profile
//           </Button>
//         </Link>
//       </div>
//     </div>
//   );
// }