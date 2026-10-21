import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectItem } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { SparklesIcon } from "lucide-react";
import "./QuestionPage.scss";

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
      className="question-page-container"
    >
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="question-title"
      >
        <SparklesIcon className="w-10 h-10 text-yellow-300 animate-pulse" />
        <span>JEE Rank & Category</span>
      </motion.h1>

      <motion.form
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        onSubmit={handleSubmit}
        className="question-form-wrapper"
      >
        <Label htmlFor="jee-rank" className="question-label">JEE Rank</Label>
        <Input
          id="jee-rank"
          type="number"
          placeholder="Enter your JEE Rank"
          value={jeeRank}
          onChange={(e) => setJeeRank(e.target.value)}
          className="question-input"
          required
        />

        <Label htmlFor="category" className="question-label">Category</Label>
        <Select
          id="category"
          value={category}
          onValueChange={setCategory}
          className="question-select"
        >
          <SelectItem value="general">General</SelectItem>
          <SelectItem value="obc">OBC</SelectItem>
          <SelectItem value="sc">SC</SelectItem>
          <SelectItem value="st">ST</SelectItem>
          <SelectItem value="ews">EWS</SelectItem>
        </Select>

        <Label className="question-label">Additional Questions</Label>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="question-group">
            <Label className="question-text">Question {index + 1}?</Label>
            <RadioGroup
              value={questions[`q${index + 1}`]}
              onValueChange={(value) => handleQuestionChange(`q${index + 1}`, value)}
              className="radio-group"
            >
              <div className="radio-option">
                <RadioGroupItem value="yes" id={`yes-q${index + 1}`} name={`q${index + 1}`} />
                <Label htmlFor={`yes-q${index + 1}`} className="yes-label">Yes</Label>
              </div>
              <div className="radio-option">
                <RadioGroupItem value="no" id={`no-q${index + 1}`} name={`q${index + 1}`} />
                <Label htmlFor={`no-q${index + 1}`} className="no-label">No</Label>
              </div>
            </RadioGroup>
          </div>
        ))}

        <Button
          type="submit"
          className="question-button" 
        >
          Submit
        </Button>
      </motion.form>
    </motion.div>
  );
}
