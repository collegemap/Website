import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SparklesIcon } from "lucide-react";
import "./RankBox.scss";

export default function JeeForm() {
  const [jeeRank, setJeeRank] = useState("");
  const [category, setCategory] = useState("");
  const [questions, setQuestions] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q5: "",
    q6: "",
  });

  const handleQuestionChange = (question, value) => {
    setQuestions((prev) => ({ ...prev, [question]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jeeRank || !category) {
      alert("Please enter both JEE Rank and Category");
      return;
    }
    alert(`JEE Rank: ${jeeRank}, Category: ${category}, Answers: ${JSON.stringify(questions)}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -50 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.8 }}
      className="w-full p-6 min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-blue-500 to-teal-400 text-white relative overflow-hidden"
    >
      <motion.h1 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.5, duration: 1 }}
        className="text-6xl font-extrabold text-center mb-8 drop-shadow-xl flex items-center space-x-3"
      >
        <SparklesIcon className="w-10 h-10 text-yellow-300 animate-pulse" />
        <span>JEE Rank & Category</span>
      </motion.h1>
      <motion.form 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.6 }}
        onSubmit={handleSubmit} 
        className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl p-10 space-y-8 border border-gray-300 text-gray-800 transform hover:scale-105 transition duration-500"
      >
        <Label htmlFor="jee-rank" className="text-blue-700 text-lg font-semibold">JEE Rank</Label>
        <Input 
          id="jee-rank"
          type="number"
          placeholder="Enter your JEE Rank"
          value={jeeRank}
          onChange={(e) => setJeeRank(e.target.value)}
          className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg w-full p-3 text-lg shadow-sm hover:ring-2 transition"
          required
        />
        <Label htmlFor="category" className="text-blue-700 text-lg font-semibold">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category" className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg w-full p-3 text-lg shadow-sm hover:ring-2 transition">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="obc">OBC</SelectItem>
            <SelectItem value="sc">SC</SelectItem>
            <SelectItem value="st">ST</SelectItem>
            <SelectItem value="ews">EWS</SelectItem>
          </SelectContent>
        </Select>
        <Label className="text-blue-700 text-lg font-semibold">Additional Questions</Label>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex flex-col space-y-2 mt-3">
            <Label className="text-gray-700">Question {index + 1}?</Label>
            <RadioGroup 
              className="flex space-x-4"
              value={questions[`q${index + 1}`]} 
              onValueChange={(value) => handleQuestionChange(`q${index + 1}`, value)}
            >
              <RadioGroupItem value="yes" id={`yes-q${index + 1}`} />
              <Label htmlFor={`yes-q${index + 1}`} className="text-green-600">Yes</Label>
              <RadioGroupItem value="no" id={`no-q${index + 1}`} />
              <Label htmlFor={`no-q${index + 1}`} className="text-red-600">No</Label>
            </RadioGroup>
          </div>
        ))}
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-teal-400 hover:from-blue-500 hover:to-teal-300 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:scale-110"
        >
          Submit
        </Button>
      </motion.form>
    </motion.div>
  );
}
