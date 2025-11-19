"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ITEM_TYPE_DATA } from "@passman/utils";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { PasswordGenerator } from "@/components/password-generator";

export function ItemFormModal({
  isOpen,
  onClose,
  isCreating,
  itemType,
  onSubmit,
  onBack,
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [activePasswordField, setActivePasswordField] = useState(null);

  const itemTypeInfo = ITEM_TYPE_DATA[itemType];

  // Reset form when modal opens or item type changes
  useEffect(() => {
    if (isOpen) {
      // Initialize form data with empty values
      const initialData = {};
      const initialErrors = {};
      const initialPasswordVisibility = {};

      if (itemTypeInfo && itemTypeInfo.formFields) {
        itemTypeInfo.formFields.forEach((field) => {
          initialData[field.name] = "";
          initialErrors[field.name] = "";
          if (field.type === "password") {
            initialPasswordVisibility[field.name] = false;
          }
        });
      }

      setFormData(initialData);
      setErrors(initialErrors);
      setShowPassword(initialPasswordVisibility);
      setShowPasswordGenerator(false);
    }
  }, [isOpen, itemType, itemTypeInfo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPassword({
      ...showPassword,
      [fieldName]: !showPassword[fieldName],
    });
  };

  const openPasswordGenerator = (fieldName) => {
    setActivePasswordField(fieldName);
    setShowPasswordGenerator(true);
  };

  const handleUseGeneratedPassword = (password) => {
    if (activePasswordField) {
      setFormData({
        ...formData,
        [activePasswordField]: password,
      });
      setShowPasswordGenerator(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (itemTypeInfo && itemTypeInfo.formFields) {
      itemTypeInfo.formFields.forEach((field) => {
        // Add basic validation rules here
        if (field.required && !formData[field.name]) {
          newErrors[field.name] = `${field.label} is required`;
          isValid = false;
        } else if (
          field.type === "email" &&
          formData[field.name] &&
          !/\S+@\S+\.\S+/.test(formData[field.name])
        ) {
          newErrors[field.name] = "Please enter a valid email address";
          isValid = false;
        } else if (
          field.type === "url" &&
          formData[field.name] &&
          !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(
            formData[field.name]
          )
        ) {
          newErrors[field.name] = "Please enter a valid URL";
          isValid = false;
        }
      });
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(itemType, formData);
    }
  };

  if (!itemTypeInfo) {
    return null;
  }

  if (showPasswordGenerator) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-md bg-black border-zinc-800"
          hideCloseButton
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Password Generator</DialogTitle>
          </DialogHeader>
          <PasswordGenerator
            onCancel={() => setShowPasswordGenerator(false)}
            onUsePassword={handleUseGeneratedPassword}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-center">
            New {itemTypeInfo.label}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="px-3">
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {itemTypeInfo.formFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor={field.name} className="text-sm font-medium">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {errors[field.name] && (
                      <span className="text-sm text-red-500">
                        {errors[field.name]}
                      </span>
                    )}
                  </div>

                  {field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      className="w-full min-h-[100px] max-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none overflow-hidden"
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "password" ? (
                    <div className="relative">
                      <Input
                        id={field.name}
                        name={field.name}
                        type={showPassword[field.name] ? "text" : "password"}
                        value={formData[field.name] || ""}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                        className="pr-20"
                      />
                      <div className="absolute right-0 top-0 h-full flex">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-full px-2"
                          onClick={() => togglePasswordVisibility(field.name)}
                        >
                          {showPassword[field.name] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-full px-2 text-xs"
                          onClick={() => openPasswordGenerator(field.name)}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </form>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isCreating}
            onClick={handleSubmit}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
